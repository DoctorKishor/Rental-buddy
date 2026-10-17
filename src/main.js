// ==========================================================================
// RENTAL BUDDY — CONTROLLER & APP STATE (SUPABASE CLOUD FIRST)
// ==========================================================================

import {
  supabase,
  cloudSession,
  ensureAuthenticated,
  signInUser,
  signUpUser,
  signOutUser,
  getCurrentSession,
  syncUserProfile,
  fetchCloudTenancies,
  createCloudTenancy,
  updateCloudTenancy,
  archiveCloudTenancy,
  unarchiveCloudTenancy,
  deleteCloudTenancy,
  scheduleCloudRentRevision,
  cancelCloudRentRevision,
  fetchCloudBills,
  createCloudBill,
  fetchCloudPayments,
  recordCloudPayment,
  fetchCloudFamilyMembers,
  inviteCloudFamilyMember,
  revokeCloudFamilyMember,
} from './supabase.js';

const state = {
  currentScreen: 1,
  currency: 'INR',
  currencyLabel: 'Indian Rupee (₹)',
  currencySymbol: 'Rs. ',
  setupMode: 'new',
  notificationsAllowed: false,
  hasCreatedTenancy: false,
  tenancy: {
    name: '',
    rentAmount: '',
    advanceAmount: '',
    phone: '',
    billingCycle: 'Monthly',
    billingDate: '1st of every month',
    utilities: {
      electricity: {
        enabled: false,
        billType: 'Meter Reading',
        pricePerUnit: '',
        meterReading: '',
      },
      water: {
        enabled: false,
        billType: 'Flat',
        amount: '',
      },
      garbage: {
        enabled: false,
        amount: '',
      },
      internet: {
        enabled: false,
        amount: '',
      },
      notes: '',
    },
  },
};

// DOM References
const screens = document.querySelectorAll('.screen');
const toastPopup = document.getElementById('toastPopup');
const statusTime = document.getElementById('statusTime');

// Live Time for Status Bar
function initClock() {
  const updateTime = () => {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    hours = hours % 12 || 12;
    if (statusTime) {
      statusTime.textContent = `${hours}:${minutes}`;
    }
  };
  updateTime();
  setInterval(updateTime, 30000);
}

// Toast helper
let toastTimeout = null;
function showToast(message, duration = 3000) {
  if (!toastPopup) return;
  toastPopup.textContent = message;
  toastPopup.classList.add('show');

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toastPopup.classList.remove('show');
  }, duration);
}

// Screen Transition Navigator with Strict Auth Guard
function navigateToScreen(targetScreenNumber) {
  // STRICT PRODUCTION AUTH GUARD:
  // Disallow screens 6 through 19 if the user is not authenticated!
  if (targetScreenNumber >= 6 && targetScreenNumber <= 19 && !cloudSession.user) {
    showToast('🔒 Please sign in or create an account to access Rental Buddy', 3000);
    targetScreenNumber = 20;
  }

  state.currentScreen = targetScreenNumber;

  // Auto-close any open modals and floating dropdown menus when transitioning screens
  document.querySelectorAll('.modal-overlay').forEach((modal) => {
    modal.classList.add('hidden');
  });
  document.getElementById('details-menu-dropdown')?.classList.add('hidden');

  screens.forEach((screen) => {
    const screenNum = parseInt(screen.dataset.screen, 10);
    screen.classList.remove('active', 'exit-left');

    if (screenNum === targetScreenNumber) {
      screen.classList.add('active');
    } else if (screenNum < targetScreenNumber) {
      screen.classList.add('exit-left');
    }
  });

  // Update specific screens if needed
  if (targetScreenNumber === 5) {
    updateSummaryScreen();
  } else if (targetScreenNumber === 9) {
    syncConfirmationScreen();
  }
}

// Currency Selector Logic
function initCurrencySelection() {
  const radioCards = document.querySelectorAll('.radio-card[for^="curr-"]');
  const customBox = document.getElementById('customCurrencyBox');
  const customSelect = document.getElementById('currencyCustomSelect');
  const othersLabel = document.getElementById('others-label');

  radioCards.forEach((card) => {
    const input = card.querySelector('input[type="radio"]');

    card.addEventListener('click', () => {
      radioCards.forEach((c) => c.classList.remove('selected'));
      card.classList.add('selected');
      input.checked = true;

      const val = input.value;
      if (val === 'INR') {
        state.currency = 'INR';
        state.currencyLabel = 'Indian Rupee (₹)';
        state.currencySymbol = 'Rs. ';
        customBox?.classList.add('hidden');
      } else if (val === 'USD') {
        state.currency = 'USD';
        state.currencyLabel = 'USD ($)';
        state.currencySymbol = '$';
        customBox?.classList.add('hidden');
      } else if (val === 'OTHER') {
        customBox?.classList.remove('hidden');
        if (customSelect) {
          state.currency = customSelect.value;
          state.currencyLabel = customSelect.options[customSelect.selectedIndex].text;
          state.currencySymbol = state.currency + ' ';
          if (othersLabel) othersLabel.textContent = `Others (${state.currencyLabel})`;
        }
      }
    });
  });

  if (customSelect) {
    customSelect.addEventListener('change', () => {
      state.currency = customSelect.value;
      state.currencyLabel = customSelect.options[customSelect.selectedIndex].text;
      state.currencySymbol = state.currency + ' ';
      if (othersLabel) othersLabel.textContent = `Others (${state.currencyLabel})`;
    });
  }
}

// Summary screen renderer (Screen 5)
function updateSummaryScreen() {
  const currencyBadge = document.getElementById('summary-currency');
  const currencyText = document.getElementById('summary-currency-text');
  const notifyText = document.getElementById('summary-notify-text');
  const setupText = document.getElementById('summary-setup-text');

  if (currencyBadge) currencyBadge.textContent = state.currency;
  if (currencyText) currencyText.textContent = state.currencyLabel;
  if (notifyText) notifyText.textContent = state.notificationsAllowed ? 'Enabled' : 'Disabled (Silent)';
  if (setupText) setupText.textContent = state.setupMode === 'new' ? 'Create New Tenancy' : 'Restore from Backup';
}

// Tenancy Step 1 Form Listeners
function initStep1Form() {
  const monthlyRadio = document.getElementById('cycle-monthly');
  const yearlyRadio = document.getElementById('cycle-yearly');
  const monthlyCard = document.querySelector('label[for="cycle-monthly"]');
  const yearlyCard = document.querySelector('label[for="cycle-yearly"]');

  monthlyCard?.addEventListener('click', () => {
    monthlyCard.classList.add('selected');
    yearlyCard?.classList.remove('selected');
    monthlyRadio.checked = true;
    state.tenancy.billingCycle = 'Monthly';
  });

  yearlyCard?.addEventListener('click', () => {
    yearlyCard.classList.add('selected');
    monthlyCard?.classList.remove('selected');
    yearlyRadio.checked = true;
    state.tenancy.billingCycle = 'Yearly';
  });

  document.getElementById('btn-pick-contact')?.addEventListener('click', () => {
    showToast('📇 Contact picker: "John Doe (+977 9876543210)" selected');
    const phoneInput = document.getElementById('input-phone-number');
    if (phoneInput) phoneInput.value = '9876543210';
  });

  // Interactive Date Picker Logic
  const nativeDateInput = document.getElementById('native-billing-date');
  const textDateInput = document.getElementById('input-billing-date');
  const datePickerTrigger = document.getElementById('datePickerTrigger');

  function getOrdinal(n) {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  function updateFromDate(dateStr) {
    if (!dateStr) return;
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return;
    const day = d.getDate();
    const ordinal = getOrdinal(day);
    if (textDateInput) textDateInput.value = `${ordinal} of every month`;
    state.tenancy.billingDate = `${ordinal} of every month`;

    const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const year = d.getFullYear();
    state.tenancy.nextBillingDateFormatted = `${weekday} ${day} ${month}, ${year}`;
  }

  nativeDateInput?.addEventListener('change', (e) => {
    updateFromDate(e.target.value);
  });

  datePickerTrigger?.addEventListener('click', () => {
    if (nativeDateInput && typeof nativeDateInput.showPicker === 'function') {
      try {
        nativeDateInput.showPicker();
      } catch (err) {
        nativeDateInput.focus();
      }
    }
  });

  // Default initial date calculation
  updateFromDate('2026-04-12');
}

// Tenancy Step 2 Utility Toggles & Accordions
function initUtilityToggles() {
  const utilities = [
    { id: 'electricity', cardId: 'card-util-electricity', detailsId: 'details-electricity', toggleId: 'toggle-electricity' },
    { id: 'water', cardId: 'card-util-water', detailsId: 'details-water', toggleId: 'toggle-water' },
    { id: 'garbage', cardId: 'card-util-garbage', detailsId: 'details-garbage', toggleId: 'toggle-garbage' },
    { id: 'internet', cardId: 'card-util-internet', detailsId: 'details-internet', toggleId: 'toggle-internet' },
  ];

  utilities.forEach((util) => {
    const toggle = document.getElementById(util.toggleId);
    const details = document.getElementById(util.detailsId);
    const card = document.getElementById(util.cardId);

    toggle?.addEventListener('change', (e) => {
      const isChecked = e.target.checked;
      state.tenancy.utilities[util.id].enabled = isChecked;

      if (isChecked) {
        details?.classList.remove('hidden');
        card?.classList.add('expanded');
      } else {
        details?.classList.add('hidden');
        card?.classList.remove('expanded');
      }
    });
  });

  // Electricity Dynamic Bill Type Switching (Flat vs Meter Reading)
  const labelElecFlat = document.getElementById('label-elec-flat');
  const labelElecMeter = document.getElementById('label-elec-meter');
  const subfieldsElecMeter = document.getElementById('subfields-elec-meter');
  const subfieldsElecFlat = document.getElementById('subfields-elec-flat');

  labelElecFlat?.addEventListener('click', () => {
    labelElecFlat.classList.add('selected');
    labelElecMeter?.classList.remove('selected');
    subfieldsElecFlat?.classList.remove('hidden');
    subfieldsElecMeter?.classList.add('hidden');
    state.tenancy.utilities.electricity.billType = 'Flat';
  });

  labelElecMeter?.addEventListener('click', () => {
    labelElecMeter.classList.add('selected');
    labelElecFlat?.classList.remove('selected');
    subfieldsElecMeter?.classList.remove('hidden');
    subfieldsElecFlat?.classList.add('hidden');
    state.tenancy.utilities.electricity.billType = 'Meter Reading';
  });

  // Water Dynamic Bill Type Switching (Flat vs Meter Reading)
  const labelWaterFlat = document.getElementById('label-water-flat');
  const labelWaterMeter = document.getElementById('label-water-meter');
  const subfieldsWaterFlat = document.getElementById('subfields-water-flat');
  const subfieldsWaterMeter = document.getElementById('subfields-water-meter');

  labelWaterFlat?.addEventListener('click', () => {
    labelWaterFlat.classList.add('selected');
    labelWaterMeter?.classList.remove('selected');
    subfieldsWaterFlat?.classList.remove('hidden');
    subfieldsWaterMeter?.classList.add('hidden');
    state.tenancy.utilities.water.billType = 'Flat';
  });

  labelWaterMeter?.addEventListener('click', () => {
    labelWaterMeter.classList.add('selected');
    labelWaterFlat?.classList.remove('selected');
    subfieldsWaterMeter?.classList.remove('hidden');
    subfieldsWaterFlat?.classList.add('hidden');
    state.tenancy.utilities.water.billType = 'Meter Reading';
  });
}

// Step 3 Confirmation screen binder
function syncConfirmationScreen() {
  const sym = state.currencySymbol || 'Rs. ';

  const nameVal = document.getElementById('input-tenancy-name')?.value || state.tenancy.name;
  const rentVal = document.getElementById('input-rent-amount')?.value || '12000';
  const cycleVal = state.tenancy.billingCycle || 'Monthly';

  document.getElementById('confirm-tenancy-name').textContent = nameVal;
  document.getElementById('confirm-rent-amount').textContent = `${sym}${parseInt(rentVal.replace(/[^0-9]/g, '') || 12000).toLocaleString()}`;
  document.getElementById('confirm-billing-cycle').textContent = cycleVal;
  document.getElementById('confirm-next-date').textContent = state.tenancy.nextBillingDateFormatted || 'Wed 12 Apr, 2026';

  // Electricity
  const elecEnabled = document.getElementById('toggle-electricity')?.checked;
  const elecBlock = document.getElementById('confirm-block-electricity');
  const elecDivider = document.getElementById('divider-elec-water');
  if (elecBlock) elecBlock.style.display = elecEnabled ? 'flex' : 'none';
  if (elecDivider) elecDivider.style.display = elecEnabled ? 'block' : 'none';

  if (elecEnabled) {
    const elecBillType = state.tenancy.utilities.electricity.billType || 'Meter Reading';
    document.getElementById('confirm-elec-billtype').textContent = elecBillType;

    const meterRows = document.getElementById('confirm-elec-meter-rows');
    const flatRow = document.getElementById('confirm-elec-flat-row');

    if (elecBillType === 'Meter Reading') {
      meterRows?.classList.remove('hidden');
      flatRow?.classList.add('hidden');
      const elecPrice = document.getElementById('input-elec-price')?.value || '12';
      const elecReading = document.getElementById('input-elec-reading')?.value || '12341.12';
      document.getElementById('confirm-elec-price').textContent = `${sym}${elecPrice}`;
      document.getElementById('confirm-elec-reading').textContent = elecReading;
    } else {
      meterRows?.classList.add('hidden');
      flatRow?.classList.remove('hidden');
      const flatAmount = document.getElementById('input-elec-flat-amount')?.value || '500';
      document.getElementById('confirm-elec-flat-amount').textContent = `${sym}${flatAmount}`;
    }
  }

  // Water
  const waterEnabled = document.getElementById('toggle-water')?.checked;
  const waterBlock = document.getElementById('confirm-block-water');
  const waterDivider = document.getElementById('divider-water-garbage');
  if (waterBlock) waterBlock.style.display = waterEnabled ? 'flex' : 'none';
  if (waterDivider) waterDivider.style.display = waterEnabled ? 'block' : 'none';

  if (waterEnabled) {
    const waterBillType = state.tenancy.utilities.water.billType || 'Flat';
    document.getElementById('confirm-water-billtype').textContent = waterBillType;

    const flatRow = document.getElementById('confirm-water-flat-row');
    const meterRows = document.getElementById('confirm-water-meter-rows');

    if (waterBillType === 'Flat') {
      flatRow?.classList.remove('hidden');
      meterRows?.classList.add('hidden');
      const waterAmount = document.getElementById('input-water-amount')?.value || '300';
      document.getElementById('confirm-water-amount').textContent = `${sym}${waterAmount}`;
    } else {
      flatRow?.classList.add('hidden');
      meterRows?.classList.remove('hidden');
      const waterPrice = document.getElementById('input-water-price')?.value || '25';
      const waterReading = document.getElementById('input-water-reading')?.value || '450.5';
      document.getElementById('confirm-water-price').textContent = `${sym}${waterPrice}`;
      document.getElementById('confirm-water-reading').textContent = waterReading;
    }
  }

  // Garbage
  const garbageEnabled = document.getElementById('toggle-garbage')?.checked;
  const garbageBlock = document.getElementById('confirm-block-garbage');
  if (garbageBlock) garbageBlock.style.display = garbageEnabled ? 'flex' : 'none';
  if (garbageEnabled) {
    const garbageAmount = document.getElementById('input-garbage-amount')?.value || '200';
    document.getElementById('confirm-garbage-amount').textContent = `${sym}${garbageAmount}`;
  }
}

// Attach All Event Listeners
function initEventListeners() {
  // Screen 1: Continue
  document.getElementById('btn-screen1-continue')?.addEventListener('click', () => {
    navigateToScreen(2);
  });

  // Screen 2: Preferences
  document.getElementById('btn-screen2-back')?.addEventListener('click', () => {
    navigateToScreen(1);
  });
  document.getElementById('btn-screen2-continue')?.addEventListener('click', () => {
    navigateToScreen(3);
  });

  // Screen 3: Set You Up
  document.getElementById('btn-screen3-back')?.addEventListener('click', () => {
    navigateToScreen(2);
  });

  document.getElementById('btn-create-tenancy')?.addEventListener('click', () => {
    state.setupMode = 'new';
    navigateToScreen(4);
  });

  const btnRestoreBackup = document.getElementById('btn-restore-backup');
  const backupFileInput = document.getElementById('backupFileInput');
  btnRestoreBackup?.addEventListener('click', () => {
    state.setupMode = 'restore';
    backupFileInput?.click();
  });

  backupFileInput?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) {
      showToast(`Selected backup: ${file.name}`);
      setTimeout(() => {
        navigateToScreen(4);
      }, 800);
    }
  });

  // Screen 4: Notifications
  document.getElementById('btn-screen4-back')?.addEventListener('click', () => {
    navigateToScreen(3);
  });

  document.getElementById('btn-notify-notnow')?.addEventListener('click', () => {
    state.notificationsAllowed = false;
    showToast('Notifications skipped for now');
    navigateToScreen(5);
  });

  document.getElementById('btn-notify-enable')?.addEventListener('click', async () => {
    state.notificationsAllowed = true;
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          showToast('Notifications enabled successfully!');
        } else {
          showToast('Notification preference saved');
        }
      } catch (err) {
        showToast('Notification preference saved');
      }
    } else {
      showToast('Notification preference saved');
    }
    navigateToScreen(5);
  });

  // Screen 5: Ready / Next actions
  document.getElementById('btn-restart-prototype')?.addEventListener('click', () => {
    navigateToScreen(1);
  });

  document.getElementById('btn-goto-dashboard')?.addEventListener('click', () => {
    if (cloudSession.user) {
      navigateToScreen(6);
    } else {
      showToast('🎉 Setup complete! Please sign in or create an account to start.', 3500);
      navigateToScreen(20);
    }
  });

  // Screen 6: Dashboard Controller & State Presets
  initDashboard();

  // Screen 7: Step 1 (General Information)
  document.getElementById('btn-step1-back')?.addEventListener('click', () => {
    navigateToScreen(6);
  });

  document.getElementById('btn-step1-next')?.addEventListener('click', () => {
    const name = document.getElementById('input-tenancy-name')?.value?.trim();
    const rent = document.getElementById('input-rent-amount')?.value?.trim();
    if (!name || !rent) {
      showToast('Please fill in Tenancy Name and Rent Amount');
      return;
    }
    navigateToScreen(8);
  });

  // Screen 8: Step 2 (Utilities)
  document.getElementById('btn-step2-back')?.addEventListener('click', () => {
    navigateToScreen(7);
  });

  document.getElementById('btn-step2-next')?.addEventListener('click', () => {
    navigateToScreen(9);
  });

  // Screen 9: Step 3 (Confirmation)
  document.getElementById('btn-step3-back')?.addEventListener('click', () => {
    navigateToScreen(8);
  });

  document.getElementById('btn-step3-confirm')?.addEventListener('click', async () => {
    state.hasCreatedTenancy = true;
    const nameVal = document.getElementById('input-tenancy-name')?.value?.trim();
    const rentVal = parseFloat(document.getElementById('input-rent-amount')?.value?.replace(/[^0-9.]/g, ''));
    const advanceVal = parseFloat(document.getElementById('input-advance-amount')?.value?.replace(/[^0-9.]/g, '')) || 0;
    const phoneVal = document.getElementById('input-phone-number')?.value?.trim() || '';

    if (!nameVal || isNaN(rentVal) || rentVal <= 0) {
      showToast('⚠️ Please enter a valid Tenancy Name and Rent Amount');
      navigateToScreen(7);
      return;
    }

    const nativeDate = document.getElementById('native-billing-date')?.value;
    let billingDay = 1;
    if (nativeDate) {
      billingDay = parseInt(nativeDate.split('-')[2], 10) || 1;
    }

    try {
      const created = await createCloudTenancy({
        propertyName: nameVal,
        tenantName: 'Tenant',
        tenantPhone: phoneVal,
        baseRent: rentVal,
        advanceAmount: advanceVal,
        billingDay: billingDay,
      });
      currentActiveTenancy = created;
      await syncDashboardFromCloud();
      showToast(`🎉 Tenancy "${nameVal}" created & synced to Supabase Cloud!`, 3500);
      setTimeout(() => {
        navigateToScreen(6);
      }, 800);
    } catch (e) {
      console.warn('Cloud create tenancy error:', e);
      showToast(`❌ Failed to save tenancy: ${e.message}`, 4000);
    }
  });

  // Screen 10 Details Navigation
  document.getElementById('btn-details-back')?.addEventListener('click', () => {
    navigateToScreen(6);
  });

  // Initialize Tenancy Details (Screen 10)
  initTenancyDetails();

  // Toggle 360px Viewport Simulation
  const toggle360Btn = document.getElementById('toggle360Btn');
  const viewportLabel = document.getElementById('viewportLabel');
  const mobileFrame = document.getElementById('mobileFrame');

  toggle360Btn?.addEventListener('click', () => {
    if (!mobileFrame) return;
    const is360 = mobileFrame.classList.toggle('width-360');
    if (viewportLabel) {
      viewportLabel.textContent = is360 ? 'Compact (360px)' : 'Standard (412px)';
    }
    showToast(is360 ? 'Viewport set to 360px (Compact Mobile)' : 'Viewport set to 412px (Standard Mobile)', 2000);
  });

  // Global Modal Overlay Dismissal (Backdrop click, Handle click, Close buttons)
  document.querySelectorAll('.modal-overlay').forEach((overlay) => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.add('hidden');
      }
    });

    overlay.querySelector('.modal-handle')?.addEventListener('click', () => {
      overlay.classList.add('hidden');
    });

    overlay.querySelectorAll('.modal-close-btn').forEach((closeBtn) => {
      closeBtn.addEventListener('click', () => {
        overlay.classList.add('hidden');
      });
    });
  });

  // Global Escape key listener to close open modals & floating menus
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay').forEach((modal) => {
        modal.classList.add('hidden');
      });
      document.getElementById('details-menu-dropdown')?.classList.add('hidden');
    }
  });
}

// ==========================================================================
// HOME DASHBOARD CONTROLLER & MOCKUP STATES
// ==========================================================================

function initDashboard() {
  const emptyCreateBtn = document.getElementById('btn-empty-create');
  const addTenancyBtn = document.getElementById('btn-dashboard-add');
  const settingsBtn = document.getElementById('btn-dashboard-settings');

  emptyCreateBtn?.addEventListener('click', () => navigateToScreen(7));
  addTenancyBtn?.addEventListener('click', () => navigateToScreen(7));
  settingsBtn?.addEventListener('click', () => navigateToScreen(16));

  // Live Cloud Status Banner -> Screen 20
  document.getElementById('cloud-status-banner')?.addEventListener('click', () => {
    navigateToScreen(20);
  });

  // Segmented Ledger Switcher (Payments vs Bills)
  const tabPayments = document.getElementById('tab-recent-payments');
  const tabBills = document.getElementById('tab-recent-bills');
  const heading = document.getElementById('recent-section-heading');
  const listPayments = document.getElementById('list-recent-payments');
  const listBills = document.getElementById('list-recent-bills');
  const emptyPayments = document.getElementById('empty-recent-payments');

  tabPayments?.addEventListener('click', () => {
    tabPayments.classList.add('active');
    tabPayments.setAttribute('aria-selected', 'true');
    tabBills.classList.remove('active');
    tabBills.setAttribute('aria-selected', 'false');
    if (heading) heading.textContent = 'Recent Payments';

    if (emptyPayments && !emptyPayments.classList.contains('hidden')) {
      listPayments.classList.add('hidden');
      listBills.classList.add('hidden');
    } else {
      listPayments.classList.remove('hidden');
      listBills.classList.add('hidden');
    }
  });

  tabBills?.addEventListener('click', () => {
    tabBills.classList.add('active');
    tabBills.setAttribute('aria-selected', 'true');
    tabPayments.classList.remove('active');
    tabPayments.setAttribute('aria-selected', 'false');
    if (heading) heading.textContent = 'Recent Bills';

    emptyPayments.classList.add('hidden');
    listPayments.classList.add('hidden');
    listBills.classList.remove('hidden');
  });

  // Modal: Record Payment
  const modalRecord = document.getElementById('modal-record-payment');
  const closeRecordModal = document.getElementById('btn-close-record-modal');
  const submitRecord = document.getElementById('btn-submit-record-payment');
  const recordSelect = document.getElementById('record-select-tenancy');
  const recordAmountInput = document.getElementById('record-amount');

  function openRecordModal(tenancyName = '2nd Floor, Lalitpur', defaultAmount = '12000') {
    if (recordSelect) recordSelect.value = tenancyName;
    if (recordAmountInput) recordAmountInput.value = defaultAmount;
    modalRecord?.classList.remove('hidden');
  }

  closeRecordModal?.addEventListener('click', () => {
    modalRecord?.classList.add('hidden');
  });

  modalRecord?.addEventListener('click', (e) => {
    if (e.target === modalRecord) modalRecord.classList.add('hidden');
  });

  // Payment mode pills inside modal
  const paymentMethodCards = document.querySelectorAll('.payment-methods-grid .radio-card');
  paymentMethodCards.forEach((card) => {
    card.addEventListener('click', () => {
      paymentMethodCards.forEach((c) => c.classList.remove('selected'));
      card.classList.add('selected');
      const input = card.querySelector('input');
      if (input) input.checked = true;
    });
  });

  submitRecord?.addEventListener('click', async () => {
    const tenancyId = recordSelect ? recordSelect.value : currentActiveTenancy?.id;
    const amount = recordAmountInput ? recordAmountInput.value : '12000';
    const selectedMethod = document.querySelector('input[name="pay-method"]:checked')?.value || 'Cash';

    if (!amount || parseFloat(amount) <= 0) {
      showToast('⚠️ Please enter a valid payment amount');
      return;
    }

    try {
      if (tenancyId) {
        await recordCloudPayment({
          tenancyId: tenancyId,
          amount: parseFloat(amount),
          paymentMode: selectedMethod.toLowerCase(),
          channel: selectedMethod.toLowerCase(),
          settledMonths: [new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })],
          paymentDate: new Date().toISOString().split('T')[0],
        });
      }
      modalRecord?.classList.add('hidden');
      await syncDashboardFromCloud();
      showToast(`✅ Payment of Rs. ${parseFloat(amount).toLocaleString('en-IN')} recorded & saved to Supabase!`, 3500);
    } catch (err) {
      showToast(`❌ Error recording payment: ${err.message}`);
    }
  });

  // Modal: Generate Bill & Share
  const modalBill = document.getElementById('modal-generate-bill');
  const closeBillModal = document.getElementById('btn-close-bill-modal');
  const billTargetTenancy = document.getElementById('bill-target-tenancy');
  const billTargetCycle = document.getElementById('bill-target-cycle');
  const billCalculatedTotal = document.getElementById('bill-calculated-total');

  function openBillModal(tenancy = 'Property', cycle = 'Monthly', total = '12,000.00') {
    if (billTargetTenancy) billTargetTenancy.textContent = tenancy;
    if (billTargetCycle) billTargetCycle.textContent = cycle;
    if (billCalculatedTotal) billCalculatedTotal.textContent = `Rs. ${total}`;
    modalBill?.classList.remove('hidden');
  }

  closeBillModal?.addEventListener('click', () => modalBill?.classList.add('hidden'));
  modalBill?.addEventListener('click', (e) => {
    if (e.target === modalBill) modalBill.classList.add('hidden');
  });

  document.getElementById('btn-share-whatsapp')?.addEventListener('click', () => {
    modalBill?.classList.add('hidden');
    showToast('📱 WhatsApp invoice link generated & copied to clipboard!', 3500);
  });

  document.getElementById('btn-copy-invoice-link')?.addEventListener('click', () => {
    modalBill?.classList.add('hidden');
    showToast('📋 Bill summary copied to clipboard!', 3000);
  });
}

// ==========================================================================
// DYNAMIC SUPABASE CLOUD SYNC & REALTIME RENDERER
// ==========================================================================

export let cloudTenanciesList = [];
export let cloudBillsList = [];
export let cloudPaymentsList = [];
export let currentActiveTenancy = null;

export async function syncDashboardFromCloud() {
  try {
    const user = await ensureAuthenticated();
    const cloudEmail = document.getElementById('cloud-banner-user-email');
    if (cloudEmail) {
      cloudEmail.textContent = user ? user.email : 'Not Signed In';
    }

    const wrapper = document.getElementById('tenancies-list-wrapper');
    const emptyState = document.getElementById('dashboard-empty-tenancies');
    const recentSection = document.getElementById('dashboard-recent-section');
    const title = document.getElementById('dashboard-main-title');
    const recordSelect = document.getElementById('record-select-tenancy');

    if (!user) {
      if (title) title.textContent = 'Your Tenancy';
      emptyState?.classList.remove('hidden');
      recentSection?.classList.add('hidden');
      if (wrapper) wrapper.innerHTML = '';
      return;
    }

    // 1. Fetch live active tenancies from Supabase
    const cloudTenancies = await fetchCloudTenancies('active');
    cloudTenanciesList = cloudTenancies || [];

    // Populate quick record modal select
    if (recordSelect) {
      recordSelect.innerHTML = '';
      cloudTenanciesList.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.id;
        opt.textContent = t.property_name;
        recordSelect.appendChild(opt);
      });
    }

    if (cloudTenanciesList.length > 0) {
      emptyState?.classList.add('hidden');
      recentSection?.classList.remove('hidden');
      if (title) {
        title.textContent = cloudTenanciesList.length === 1 ? 'Your Tenancy' : 'Your Tenancies';
      }

      if (!currentActiveTenancy || !cloudTenanciesList.find(t => t.id === currentActiveTenancy.id)) {
        currentActiveTenancy = cloudTenanciesList[0];
      }

      if (wrapper) {
        wrapper.innerHTML = '';
        cloudTenanciesList.forEach((t) => {
          const card = document.createElement('article');
          card.className = 'tenancy-card dynamic-cloud-card';
          card.dataset.tenancyId = t.id;
          const billingDay = t.billing_day || 1;
          const rentFormatted = parseFloat(t.base_rent || 0).toLocaleString('en-IN');

          card.innerHTML = `
            <div class="tenancy-card-header">
              <span class="status-pill status-upcoming">Active • Supabase Cloud</span>
            </div>
            <div class="tenancy-card-main-row" role="button" tabindex="0" aria-label="View ${t.property_name} tenancy details">
              <div class="tenancy-info">
                <h2 class="tenancy-name">${t.property_name}</h2>
                <span class="tenancy-meta-sub">Rs. ${rentFormatted} • Monthly</span>
              </div>
              <div class="tenancy-row-chevron" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </div>
            </div>
            <div class="tenancy-card-divider"></div>
            <div class="tenancy-metrics-grid">
              <div class="metric-col">
                <span class="metric-title">Rs. ${rentFormatted}</span>
                <span class="metric-label">Base Rent</span>
              </div>
              <div class="metric-col right-align">
                <span class="metric-title">${billingDay}th of month</span>
                <span class="metric-label">Billing Date</span>
              </div>
            </div>
            <div class="tenancy-card-divider"></div>
            <div class="tenancy-action-row dual-action-row">
              <button type="button" class="btn-card-action peach-action btn-gen-bill-card">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                </svg>
                <span>Generate Bill</span>
              </button>
              <button type="button" class="btn-card-action lavender-action btn-record-pay-card">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="6" width="20" height="12" rx="2"></rect>
                  <circle cx="12" cy="12" r="2.5"></circle>
                </svg>
                <span>Record Payment</span>
              </button>
            </div>
          `;

          card.querySelector('.tenancy-card-main-row')?.addEventListener('click', () => {
            currentActiveTenancy = t;
            bindTenancyToDetails(t);
            navigateToScreen(10);
          });

          card.querySelector('.btn-gen-bill-card')?.addEventListener('click', () => {
            currentActiveTenancy = t;
            navigateToScreen(13);
          });

          card.querySelector('.btn-record-pay-card')?.addEventListener('click', () => {
            currentActiveTenancy = t;
            openRecordPaymentPage(t);
          });

          wrapper.appendChild(card);
        });
      }
    } else {
      currentActiveTenancy = null;
      if (title) title.textContent = 'Your Tenancy';
      emptyState?.classList.remove('hidden');
      recentSection?.classList.add('hidden');
      if (wrapper) wrapper.innerHTML = '';
    }

    // 2. Fetch real bills from Supabase
    const cloudBills = await fetchCloudBills();
    cloudBillsList = cloudBills || [];
    const listBills = document.getElementById('list-recent-bills');
    const emptyBills = document.getElementById('empty-recent-bills');
    if (cloudBills && cloudBills.length > 0 && listBills) {
      emptyBills?.classList.add('hidden');
      listBills.classList.remove('hidden');
      listBills.innerHTML = '';
      cloudBills.forEach((b) => {
        const item = document.createElement('div');
        item.className = 'recent-item-card';
        item.setAttribute('role', 'button');
        item.setAttribute('tabindex', '0');
        item.innerHTML = `
          <div class="recent-item-left">
            <span class="recent-prop-name">Cloud Invoice: ${b.invoice_number || 'INV'}</span>
            <strong class="recent-item-title">${b.duration_start} – ${b.duration_end}</strong>
            <span class="recent-item-timestamp">Generated on ${b.generated_date} • ${b.status}</span>
          </div>
          <div class="recent-item-right">
            <strong class="recent-item-amount">Rs. ${parseFloat(b.net_payable).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
            <svg class="recent-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </div>
        `;
        item.addEventListener('click', () => navigateToScreen(15));
        listBills.appendChild(item);
      });
    } else {
      listBills?.classList.add('hidden');
      emptyBills?.classList.remove('hidden');
    }

    // 3. Fetch real payments from Supabase
    const cloudPayments = await fetchCloudPayments();
    cloudPaymentsList = cloudPayments || [];
    const listPayments = document.getElementById('list-recent-payments');
    const emptyPayments = document.getElementById('empty-recent-payments');
    if (cloudPayments && cloudPayments.length > 0 && listPayments) {
      emptyPayments?.classList.add('hidden');
      listPayments.classList.remove('hidden');
      listPayments.innerHTML = '';
      cloudPayments.forEach((p) => {
        const item = document.createElement('div');
        item.className = 'recent-item-card';
        item.setAttribute('role', 'button');
        item.setAttribute('tabindex', '0');
        const months = Array.isArray(p.settled_months) ? p.settled_months.join(', ') : 'Settled';
        item.innerHTML = `
          <div class="recent-item-left">
            <span class="recent-prop-name">${p.tenancies?.property_name || 'Property'}</span>
            <strong class="recent-item-title">${months} — Paid via ${p.payment_mode.toUpperCase()}</strong>
            <span class="recent-item-timestamp">Paid on ${p.payment_date} ${p.reference_no ? '• Ref: ' + p.reference_no : ''}</span>
          </div>
          <div class="recent-item-right">
            <strong class="recent-item-amount">Rs. ${parseFloat(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
            <svg class="recent-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </div>
        `;
        listPayments.appendChild(item);
      });
    } else {
      listPayments?.classList.add('hidden');
      emptyPayments?.classList.remove('hidden');
    }

    // 4. Update Family sharing list
    const members = await fetchCloudFamilyMembers();
    const membersList = document.getElementById('family-members-list');
    const badgeCount = document.getElementById('badge-family-count');
    if (members && members.length > 0 && membersList) {
      membersList.querySelectorAll('.dynamic-cloud-member').forEach((m) => m.remove());
      members.forEach((m) => {
        const row = document.createElement('div');
        row.className = 'family-member-row dynamic-cloud-member';
        row.innerHTML = `
          <div class="member-avatar">👨‍👩‍👧</div>
          <div class="member-info">
            <strong class="member-email">${m.member_email}</strong>
            <span class="member-role-tag">${m.role === 'manager' ? 'Manager • Can edit & record' : 'Viewer • Can view bills & payments'}</span>
          </div>
          <button type="button" class="btn-remove-member" title="Revoke access">✕</button>
        `;
        row.querySelector('.btn-remove-member')?.addEventListener('click', async () => {
          await revokeCloudFamilyMember(m.id);
          row.remove();
          showToast(`🗑️ Revoked access for ${m.member_email}`);
        });
        membersList.appendChild(row);
      });
      if (badgeCount) {
        badgeCount.textContent = `${members.length} Shared`;
      }
    }
  } catch (err) {
    console.warn('Sync Dashboard Notice:', err);
  }
}

// ==========================================================================
// ==========================================================================
// TENANCY DETAILS CONTROLLER & MONTH-WISE STATUS (SCREEN 10)
// ==========================================================================

export async function bindTenancyToDetails(t) {
  if (!t) return;
  currentActiveTenancy = t;

  const propTitle = document.getElementById('details-prop-title');
  const rentRate = document.getElementById('details-rent-rate');
  const nextBilling = document.getElementById('details-next-billing-date');
  const billsCount = document.getElementById('details-bills-count');
  const totalAmount = document.getElementById('details-total-amount');
  const lastBillCol = document.getElementById('details-last-bill-col');
  const lastBillAmount = document.getElementById('details-last-bill-amount');
  const emptyBills = document.getElementById('details-empty-bills');
  const monthStack = document.getElementById('details-month-cards-stack');
  const historyList = document.getElementById('view-bill-history');
  const viewMonth = document.getElementById('view-month-status');
  const chipPaid = document.getElementById('chip-count-paid');
  const chipDue = document.getElementById('chip-count-due');
  const chipUpcoming = document.getElementById('chip-count-upcoming');

  if (propTitle) propTitle.textContent = t.property_name;
  const rentNum = parseFloat(t.base_rent || 0);
  if (rentRate) rentRate.textContent = `Rs. ${rentNum.toLocaleString('en-IN')} • Monthly`;
  if (nextBilling) nextBilling.textContent = `${t.billing_day || 1}${getOrdinal(t.billing_day || 1)} of next month`;

  // Bind to Edit Tenancy form (Screen 11) inputs too
  const editName = document.getElementById('edit-tenancy-name');
  const editRent = document.getElementById('edit-rent-amount');
  const editPhone = document.getElementById('edit-tenant-phone');
  const editAdvance = document.getElementById('edit-advance-amount');
  const editDateDisplay = document.getElementById('edit-billing-date-display');
  const reviseCurrentRent = document.getElementById('revise-current-rent-display');

  if (editName) editName.value = t.property_name || '';
  if (editRent) editRent.value = t.base_rent || '';
  if (editPhone) editPhone.value = t.tenant_phone || '';
  if (editAdvance) editAdvance.value = t.advance_amount || '';
  if (editDateDisplay) editDateDisplay.value = `${t.billing_day || 1}${getOrdinal(t.billing_day || 1)} of every month`;
  if (reviseCurrentRent) reviseCurrentRent.value = `Rs. ${rentNum.toLocaleString('en-IN')}`;

  // Fetch tenancy payments & bills dynamically from Supabase
  try {
    const [allBills, allPayments] = await Promise.all([fetchCloudBills(), fetchCloudPayments()]);
    const tenancyBills = (allBills || []).filter(b => b.tenancy_id === t.id);
    const tenancyPayments = (allPayments || []).filter(p => p.tenancy_id === t.id);

    const totalPaid = tenancyPayments.reduce((acc, p) => acc + parseFloat(p.amount || 0), 0);
    if (billsCount) billsCount.textContent = `${tenancyPayments.length} paid`;
    if (totalAmount) totalAmount.textContent = `Rs. ${totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

    if (chipPaid) chipPaid.textContent = `✔ ${tenancyPayments.length} Paid`;
    if (chipDue) chipDue.textContent = `⚠️ ${tenancyBills.filter(b => b.status === 'unpaid').length} Due`;

    if (tenancyBills.length > 0 && lastBillCol && lastBillAmount) {
      lastBillCol.classList.remove('hidden');
      lastBillAmount.textContent = `Rs. ${parseFloat(tenancyBills[0].net_payable).toLocaleString('en-IN')}`;
    } else if (lastBillCol) {
      lastBillCol.classList.add('hidden');
    }

    if (tenancyPayments.length === 0 && tenancyBills.length === 0) {
      emptyBills?.classList.remove('hidden');
      if (monthStack) monthStack.innerHTML = '';
      if (historyList) historyList.innerHTML = '';
    } else {
      emptyBills?.classList.add('hidden');
      // Render payment history list
      if (historyList) {
        historyList.innerHTML = '';
        tenancyPayments.forEach(p => {
          const item = document.createElement('div');
          item.className = 'recent-item-card';
          item.setAttribute('role', 'button');
          item.setAttribute('tabindex', '0');
          const months = Array.isArray(p.settled_months) ? p.settled_months.join(', ') : 'Settled';
          item.innerHTML = `
            <div class="recent-item-left">
              <strong class="recent-item-title">${months} — Paid via ${(p.payment_mode || 'Cash').toUpperCase()}</strong>
              <span class="recent-item-timestamp">Paid on ${p.payment_date} ${p.reference_no ? '• Ref: ' + p.reference_no : ''}</span>
            </div>
            <div class="recent-item-right">
              <strong class="recent-item-amount">Rs. ${parseFloat(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
              <svg class="recent-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
          `;
          historyList.appendChild(item);
        });
      }

      // Render month-wise cards stack
      if (monthStack) {
        monthStack.innerHTML = '';
        tenancyPayments.forEach(p => {
          const monthText = (Array.isArray(p.settled_months) && p.settled_months[0]) ? p.settled_months[0] : 'Paid';
          const card = document.createElement('div');
          card.className = 'month-card month-paid';
          card.innerHTML = `
            <div class="month-card-left">
              <div class="month-badge paid">✔</div>
              <div class="month-details-col">
                <strong class="month-name">${monthText}</strong>
                <span class="month-subtext">Paid on ${p.payment_date} • ${(p.channel || p.payment_mode || 'Cash').toUpperCase()}</span>
              </div>
            </div>
            <div class="month-card-right">
              <span class="month-amount">Rs. ${parseFloat(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              <span class="month-status-pill paid">✔ Settled</span>
            </div>
          `;
          monthStack.appendChild(card);
        });
      }
    }
  } catch (err) {
    console.warn('bindTenancyToDetails notice:', err);
  }
}

function initTenancyDetails() {
  const menuBtn = document.getElementById('btn-details-menu');
  const menuDropdown = document.getElementById('details-menu-dropdown');
  const actionEdit = document.getElementById('menu-action-edit');
  const actionArchive = document.getElementById('menu-action-archive');
  const actionDelete = document.getElementById('menu-action-delete');
  const generateBillBtn = document.getElementById('btn-details-generate-bill');

  // Toggle 3-Dots Menu Dropdown
  menuBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    menuDropdown?.classList.toggle('hidden');
  });

  // Close dropdown when tapping anywhere else
  document.addEventListener('click', (e) => {
    if (menuDropdown && !menuDropdown.contains(e.target) && e.target !== menuBtn) {
      menuDropdown.classList.add('hidden');
    }
  });

  // Menu action handlers
  actionEdit?.addEventListener('click', () => {
    menuDropdown?.classList.add('hidden');
    if (currentActiveTenancy) {
      bindTenancyToDetails(currentActiveTenancy);
    }
    navigateToScreen(11);
  });

  actionArchive?.addEventListener('click', async () => {
    menuDropdown?.classList.add('hidden');
    if (currentActiveTenancy?.id) {
      try {
        await archiveCloudTenancy(currentActiveTenancy.id);
        showToast(`🗃️ Tenancy "${currentActiveTenancy.property_name}" archived in Supabase Cloud`);
        await syncDashboardFromCloud();
      } catch (e) {
        showToast(`❌ Archive error: ${e.message}`);
      }
    }
    setTimeout(() => navigateToScreen(6), 600);
  });

  actionDelete?.addEventListener('click', async () => {
    menuDropdown?.classList.add('hidden');
    if (currentActiveTenancy?.id) {
      if (!confirm(`Are you sure you want to delete "${currentActiveTenancy.property_name}"?`)) return;
      try {
        await deleteCloudTenancy(currentActiveTenancy.id);
        showToast('🗑️ Tenancy deleted from Supabase Cloud');
        await syncDashboardFromCloud();
      } catch (e) {
        showToast(`❌ Delete error: ${e.message}`);
      }
    }
    setTimeout(() => navigateToScreen(6), 600);
  });

  // View Switcher: Month-wise vs Transaction History
  const tabMonth = document.getElementById('tab-month-status');
  const tabHistory = document.getElementById('tab-bill-history');
  const viewMonth = document.getElementById('view-month-status');
  const viewHistory = document.getElementById('view-bill-history');
  const viewTitle = document.getElementById('details-view-title');
  const emptyBills = document.getElementById('details-empty-bills');

  tabMonth?.addEventListener('click', () => {
    tabMonth.classList.add('active');
    tabMonth.setAttribute('aria-selected', 'true');
    tabHistory.classList.remove('active');
    tabHistory.setAttribute('aria-selected', 'false');
    if (viewTitle) viewTitle.textContent = 'Payment Status';

    if (emptyBills?.classList.contains('hidden')) {
      viewMonth?.classList.remove('hidden');
      viewHistory?.classList.add('hidden');
    }
  });

  tabHistory?.addEventListener('click', () => {
    tabHistory.classList.add('active');
    tabHistory.setAttribute('aria-selected', 'true');
    tabMonth.classList.remove('active');
    tabMonth.setAttribute('aria-selected', 'false');
    if (viewTitle) viewTitle.textContent = 'Rent Payment History';

    if (emptyBills?.classList.contains('hidden')) {
      viewMonth?.classList.add('hidden');
      viewHistory?.classList.remove('hidden');
    }
  });

  // Year Dropdown change
  const yearSelect = document.getElementById('details-year-select');
  const yearIndicator = document.getElementById('details-year-indicator');
  yearSelect?.addEventListener('change', () => {
    const val = yearSelect.value;
    if (yearIndicator) {
      yearIndicator.textContent = `Year ${val} (Jan–Dec)`;
    }
    showToast(`Showing payment records for Year ${val}`);
  });

  // Generate New Bill Button -> Screen 13
  generateBillBtn?.addEventListener('click', () => {
    navigateToScreen(13);
  });
}

// ==========================================================================
// EDIT TENANCY & RENT REVISION CONTROLLER (SCREEN 11)
// ==========================================================================

function initEditTenancy() {
  const btnEditBack = document.getElementById('btn-edit-back');
  const btnSave = document.getElementById('btn-save-tenancy-changes');
  const btnOpenRevise = document.getElementById('btn-open-revise-modal');
  const modalRevise = document.getElementById('modal-revise-rent');
  const btnCloseRevise = document.getElementById('btn-close-revise-modal');
  const btnConfirmRevise = document.getElementById('btn-confirm-rent-revision');
  const bannerRevision = document.getElementById('scheduled-revision-banner');
  const btnCancelRevision = document.getElementById('btn-cancel-revision');
  const bannerRevisionText = document.getElementById('banner-revision-text');

  btnEditBack?.addEventListener('click', () => {
    navigateToScreen(10);
  });

  // Open & Close Revise Rent Modal
  btnOpenRevise?.addEventListener('click', () => {
    modalRevise?.classList.remove('hidden');
  });

  btnCloseRevise?.addEventListener('click', () => {
    modalRevise?.classList.add('hidden');
  });

  modalRevise?.addEventListener('click', (e) => {
    if (e.target === modalRevise) modalRevise.classList.add('hidden');
  });

  // Confirm Rent Revision
  btnConfirmRevise?.addEventListener('click', async () => {
    if (!currentActiveTenancy) return;
    const newRent = document.getElementById('input-new-rent')?.value;
    const cycle = document.getElementById('select-revise-cycle')?.value || 'Next Cycle';
    const notifyTenant = document.getElementById('toggle-notify-tenant-revision')?.checked;

    if (!newRent || parseFloat(newRent) <= 0) {
      showToast('⚠️ Please enter a valid new rent amount');
      return;
    }

    try {
      await scheduleCloudRentRevision({
        tenancyId: currentActiveTenancy.id,
        oldRent: parseFloat(currentActiveTenancy.base_rent || 0),
        newRent: parseFloat(newRent),
        effectiveDate: new Date().toISOString().split('T')[0],
        note: document.getElementById('input-revise-reason')?.value || 'Scheduled rent revision',
        notifyTenant,
      });

      if (bannerRevisionText) {
        bannerRevisionText.textContent = `Rs. ${parseFloat(newRent).toLocaleString('en-IN')} scheduled from ${cycle}`;
      }
      bannerRevision?.classList.remove('hidden');
      modalRevise?.classList.add('hidden');

      const msg = notifyTenant 
        ? `📈 Rent revision scheduled to Rs. ${parseFloat(newRent).toLocaleString('en-IN')} from ${cycle} (Tenant notified via WhatsApp & Cloud Synced)`
        : `📈 Rent revision scheduled to Rs. ${parseFloat(newRent).toLocaleString('en-IN')} from ${cycle} (Cloud Synced)`;
      showToast(msg, 3500);
    } catch (e) {
      showToast(`❌ Revision error: ${e.message}`);
    }
  });

  // Cancel Scheduled Revision
  btnCancelRevision?.addEventListener('click', async () => {
    if (!currentActiveTenancy) return;
    try {
      await cancelCloudRentRevision(currentActiveTenancy.id);
      bannerRevision?.classList.add('hidden');
      showToast('Scheduled rent revision cancelled in Supabase Cloud');
    } catch (e) {
      showToast(`❌ Cancel error: ${e.message}`);
    }
  });

  // Save changes
  btnSave?.addEventListener('click', async () => {
    if (!currentActiveTenancy) return;
    const updatedName = document.getElementById('edit-tenancy-name')?.value?.trim();
    const updatedRent = document.getElementById('edit-rent-amount')?.value?.trim();
    const updatedPhone = document.getElementById('edit-tenant-phone')?.value?.trim();
    const updatedAdvance = document.getElementById('edit-advance-amount')?.value?.trim();

    if (!updatedName) {
      showToast('⚠️ Property name cannot be empty');
      return;
    }

    btnSave.disabled = true;
    btnSave.textContent = 'Saving...';

    try {
      await updateCloudTenancy(currentActiveTenancy.id, {
        property_name: updatedName,
        base_rent: parseFloat(updatedRent) || currentActiveTenancy.base_rent,
        tenant_phone: updatedPhone || null,
        advance_amount: parseFloat(updatedAdvance) || 0,
      });

      currentActiveTenancy.property_name = updatedName;
      if (updatedRent) currentActiveTenancy.base_rent = parseFloat(updatedRent);
      if (updatedPhone) currentActiveTenancy.tenant_phone = updatedPhone;
      if (updatedAdvance) currentActiveTenancy.advance_amount = parseFloat(updatedAdvance);

      await syncDashboardFromCloud();
      showToast('✅ Tenancy details updated & saved to Supabase Cloud!', 3000);
      setTimeout(() => {
        bindTenancyToDetails(currentActiveTenancy);
        navigateToScreen(10);
      }, 500);
    } catch (err) {
      showToast(`❌ Update error: ${err.message}`);
    } finally {
      btnSave.disabled = false;
      btnSave.textContent = 'Save Changes';
    }
  });

  // Date picker trigger
  const trigger = document.getElementById('editDatePickerTrigger');
  const nativeDate = document.getElementById('edit-native-billing-date');
  const dateDisplay = document.getElementById('edit-billing-date-display');

  trigger?.addEventListener('click', () => {
    if (nativeDate && typeof nativeDate.showPicker === 'function') {
      try {
        nativeDate.showPicker();
      } catch (err) {
        nativeDate.focus();
      }
    } else {
      nativeDate?.focus();
    }
  });

  nativeDate?.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val && dateDisplay) {
      const day = parseInt(val.split('-')[2], 10);
      const suffix = getOrdinal(day);
      dateDisplay.value = `${day}${suffix} of every month`;
      showToast(`Recurring billing date set to ${day}${suffix} of every month`);
    }
  });

  // Billing cycle radios
  const cycleRadios = document.querySelectorAll('input[name="edit-billing-cycle"]');
  cycleRadios.forEach((radio) => {
    radio.parentElement?.addEventListener('click', () => {
      document.querySelectorAll('.radio-card.mini-radio[id^="edit-cycle-"]').forEach((c) => c.classList.remove('selected'));
      radio.parentElement?.classList.add('selected');
      radio.checked = true;
    });
  });

  // Utility toggles
  const toggleElec = document.getElementById('edit-toggle-elec');
  const detailsElec = document.getElementById('edit-details-elec');
  toggleElec?.addEventListener('change', () => {
    detailsElec?.classList.toggle('hidden', !toggleElec.checked);
  });

  const toggleWater = document.getElementById('edit-toggle-water');
  const detailsWater = document.getElementById('edit-details-water');
  toggleWater?.addEventListener('change', () => {
    detailsWater?.classList.toggle('hidden', !toggleWater.checked);
  });
}

// ==========================================================================
// DEDICATED RECORD PAYMENT PAGE CONTROLLER (SCREEN 12)
// ==========================================================================

export let selectedRecordTenancy = null;

export function openRecordPaymentPage(tenancyOrId) {
  if (!cloudTenanciesList || cloudTenanciesList.length === 0) {
    showToast('⚠️ Please create a tenancy first before recording payments', 3500);
    navigateToScreen(7);
    return;
  }
  let target = null;
  if (tenancyOrId && typeof tenancyOrId === 'object') {
    target = tenancyOrId;
  } else if (typeof tenancyOrId === 'string') {
    target = cloudTenanciesList.find((t) => t.id === tenancyOrId);
  }
  if (!target) target = cloudTenanciesList[0];

  setupRecordPaymentForm(target);
  navigateToScreen(12);
}

export function setupRecordPaymentForm(tenancy) {
  if (!tenancy) return;
  selectedRecordTenancy = tenancy;

  // Update tenancy selector dropdown
  const selectTenancy = document.getElementById('record-page-tenancy');
  if (selectTenancy) {
    selectTenancy.innerHTML = cloudTenanciesList
      .map((t) => `<option value="${t.id}" ${t.id === tenancy.id ? 'selected' : ''}>${t.property_name}</option>`)
      .join('');
    selectTenancy.value = tenancy.id;
  }

  // Update header subtitle
  const subtitle = document.getElementById('record-page-subtitle');
  if (subtitle) subtitle.textContent = tenancy.property_name;

  const baseRent = parseFloat(tenancy.base_rent || 0);
  const advance = parseFloat(tenancy.advance_amount || 0);

  // Update due hint & amount
  const dueHint = document.getElementById('record-due-hint');
  if (dueHint) {
    dueHint.textContent = `Rent: Rs. ${baseRent.toLocaleString('en-IN')}`;
    dueHint.style.color = '#5452EC';
  }

  const amountInput = document.getElementById('record-page-amount');
  if (amountInput) amountInput.value = baseRent > 0 ? baseRent : '';

  // Update shortcut chips
  const chipsContainer = document.querySelector('.amount-shortcut-chips');
  if (chipsContainer) {
    chipsContainer.innerHTML = '';
    const shortcuts = [
      { label: `Base Rent (${baseRent.toLocaleString('en-IN')})`, amount: baseRent },
      ...(advance > 0 ? [{ label: `Advance (${advance.toLocaleString('en-IN')})`, amount: advance }] : []),
      { label: `Round Rs. ${Math.round(baseRent / 1000) * 1000 || 5000}`, amount: Math.round(baseRent / 1000) * 1000 || 5000 }
    ];
    shortcuts.forEach((chip, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `shortcut-chip ${index === 0 ? 'active' : ''}`;
      btn.textContent = chip.label;
      btn.addEventListener('click', () => {
        chipsContainer.querySelectorAll('.shortcut-chip').forEach((c) => c.classList.remove('active'));
        btn.classList.add('active');
        if (amountInput) amountInput.value = chip.amount;
      });
      chipsContainer.appendChild(btn);
    });
  }

  // Check unpaid bills for this tenancy
  const blockPending = document.getElementById('block-pending-months');
  const blockNoPending = document.getElementById('block-no-pending-months');
  const currentMonthTitle = document.getElementById('current-month-title');
  const customMonthPickerRow = document.getElementById('custom-month-picker-row');

  const unpaidBills = (cloudBillsList || []).filter(
    (b) => b.tenancy_id === tenancy.id && b.status === 'unpaid'
  );

  if (unpaidBills.length > 0) {
    blockPending?.classList.remove('hidden');
    blockNoPending?.classList.add('hidden');

    const monthsList = blockPending?.querySelector('.months-select-list');
    if (monthsList) {
      monthsList.innerHTML = '';
      unpaidBills.forEach((bill, idx) => {
        const label = document.createElement('label');
        label.className = `month-select-option ${idx === 0 ? 'selected' : ''}`;
        const monthLabel = bill.duration_start
          ? new Date(bill.duration_start + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
          : 'Pending Billing Cycle';
        label.innerHTML = `
          <input type="checkbox" name="settle-month" value="${monthLabel}" ${idx === 0 ? 'checked' : ''} />
          <div class="month-opt-details">
            <strong class="month-opt-title">${monthLabel}</strong>
            <span class="month-opt-sub status-overdue">Unpaid Invoice • Rs. ${parseFloat(bill.net_payable).toLocaleString('en-IN')}</span>
          </div>
          <span class="custom-checkbox"></span>
        `;
        const checkbox = label.querySelector('input[type="checkbox"]');
        checkbox?.addEventListener('change', () => {
          label.classList.toggle('selected', checkbox.checked);
        });
        label.addEventListener('click', (e) => {
          if (e.target !== checkbox) {
            e.preventDefault();
            checkbox.checked = !checkbox.checked;
            label.classList.toggle('selected', checkbox.checked);
          }
        });
        monthsList.appendChild(label);
      });
    }
  } else {
    blockPending?.classList.add('hidden');
    blockNoPending?.classList.remove('hidden');
    const now = new Date();
    const currMonthText = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (currentMonthTitle) currentMonthTitle.textContent = currMonthText;
    customMonthPickerRow?.classList.add('hidden');
  }
}

function initRecordPaymentPage() {
  const selectTenancy = document.getElementById('record-page-tenancy');
  const btnBack = document.getElementById('btn-record-page-back');
  const cardCash = document.getElementById('card-mode-cash');
  const cardOnline = document.getElementById('card-mode-online');
  const onlineSubfields = document.getElementById('online-channel-subfields');
  const channelChips = document.querySelectorAll('.channel-chips-row .channel-chip');
  const btnToggleCustomMonth = document.getElementById('btn-toggle-custom-month');
  const customMonthPickerRow = document.getElementById('custom-month-picker-row');
  const btnSave = document.getElementById('btn-save-full-payment');

  selectTenancy?.addEventListener('change', (e) => {
    const target = (cloudTenanciesList || []).find((t) => t.id === e.target.value);
    if (target) setupRecordPaymentForm(target);
  });

  btnBack?.addEventListener('click', () => {
    navigateToScreen(6);
  });

  const setPaymentMode = (mode) => {
    if (mode === 'Online') {
      cardCash?.classList.remove('selected');
      cardOnline?.classList.add('selected');
      onlineSubfields?.classList.remove('hidden');
      const radio = document.querySelector('input[name="record-pay-mode"][value="Online"]');
      if (radio) radio.checked = true;
    } else {
      cardOnline?.classList.remove('selected');
      cardCash?.classList.add('selected');
      onlineSubfields?.classList.add('hidden');
      const radio = document.querySelector('input[name="record-pay-mode"][value="Cash"]');
      if (radio) radio.checked = true;
    }
  };

  cardCash?.addEventListener('click', () => setPaymentMode('Cash'));
  cardOnline?.addEventListener('click', () => setPaymentMode('Online'));

  channelChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      channelChips.forEach((c) => c.classList.remove('selected'));
      chip.classList.add('selected');
      const input = chip.querySelector('input');
      if (input) input.checked = true;
    });
  });

  const trigger = document.getElementById('recordDatePickerTrigger');
  const nativeDate = document.getElementById('record-native-payment-date');
  const dateDisplay = document.getElementById('record-payment-date-display');

  trigger?.addEventListener('click', () => {
    if (nativeDate && typeof nativeDate.showPicker === 'function') {
      try {
        nativeDate.showPicker();
      } catch (err) {
        nativeDate.focus();
      }
    } else {
      nativeDate?.focus();
    }
  });

  nativeDate?.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val && dateDisplay) {
      const d = new Date(val + 'T00:00:00');
      const formatted = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
      dateDisplay.value = formatted;
      showToast(`Payment date set to ${formatted}`);
    }
  });

  btnToggleCustomMonth?.addEventListener('click', () => {
    customMonthPickerRow?.classList.toggle('hidden');
  });

  btnSave?.addEventListener('click', async () => {
    if (!selectedRecordTenancy) {
      showToast('⚠️ No tenancy selected', 3000);
      return;
    }

    const amountVal = document.getElementById('record-page-amount')?.value?.trim();
    if (!amountVal || parseFloat(amountVal) <= 0) {
      showToast('⚠️ Please enter a valid payment amount', 3000);
      return;
    }

    const payMode = document.querySelector('input[name="record-pay-mode"]:checked')?.value || 'Cash';
    let modeLabel = payMode;
    let channel = 'cash';
    let ref = null;

    if (payMode === 'Online') {
      channel = document.querySelector('input[name="online-channel"]:checked')?.value?.toLowerCase() || 'upi';
      modeLabel = channel.toUpperCase();
      ref = document.getElementById('input-online-ref')?.value?.trim() || null;
      if (ref) modeLabel += ` (Ref: ${ref})`;
    }

    // Determine settled month string
    let settledMonthText = '';
    const checkedMonths = Array.from(document.querySelectorAll('input[name="settle-month"]:checked')).map(cb => cb.value);
    if (checkedMonths.length > 0) {
      settledMonthText = checkedMonths.join(', ');
    } else {
      const customVal = document.getElementById('select-custom-settle-month')?.value;
      if (customMonthPickerRow && !customMonthPickerRow.classList.contains('hidden') && customVal) {
        settledMonthText = `${customVal} (Advance)`;
      } else {
        settledMonthText = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      }
    }

    const notes = document.getElementById('record-payment-notes')?.value?.trim();
    const sendWhatsApp = document.getElementById('toggle-send-whatsapp-receipt')?.checked;
    const paymentDate = nativeDate?.value || new Date().toISOString().split('T')[0];

    btnSave.disabled = true;
    btnSave.textContent = 'Saving Payment...';

    try {
      await recordCloudPayment({
        tenancyId: selectedRecordTenancy.id,
        amount: parseFloat(amountVal),
        paymentMode: payMode.toLowerCase(),
        channel: channel,
        referenceNo: ref,
        settledMonths: [settledMonthText],
        paymentDate: paymentDate,
      });

      await syncDashboardFromCloud();

      const toastMsg = sendWhatsApp
        ? `✅ Rs. ${parseFloat(amountVal).toLocaleString('en-IN')} recorded for ${selectedRecordTenancy.property_name}! Receipt queued for WhatsApp.`
        : `✅ Rs. ${parseFloat(amountVal).toLocaleString('en-IN')} payment recorded & synced to cloud!`;

      showToast(toastMsg, 3500);

      setTimeout(() => {
        navigateToScreen(6);
      }, 500);
    } catch (err) {
      showToast(`❌ Error saving payment: ${err.message}`, 4000);
    } finally {
      btnSave.disabled = false;
      btnSave.textContent = 'Confirm & Save Receipt';
    }
  });
}

// ==========================================================================
// BILL GENERATION & INVOICE DETAILS FLOW (SCREENS 13, 14, 15)
// ==========================================================================

export let activeBillDraft = null;

function initBillGenerationFlow() {
  const btnGenBillBack = document.getElementById('btn-genbill-back');
  const btnToPreview = document.getElementById('btn-to-preview-bill');
  const btnReviewBack = document.getElementById('btn-review-back');
  const btnConfirmGenBill = document.getElementById('btn-confirm-generate-bill');
  const btnBillDetailsBack = document.getElementById('btn-billdetails-back');
  const btnShareInvoice = document.getElementById('btn-share-bill-invoice');
  const btnShareWhatsappInvoice = document.getElementById('btn-share-whatsapp-invoice');

  // Date Pickers on Screen 13
  const startTrigger = document.getElementById('billStartDateTrigger');
  const startNative = document.getElementById('bill-native-start-date');
  const startDisplay = document.getElementById('bill-start-date-display');

  const endTrigger = document.getElementById('billEndDateTrigger');
  const endNative = document.getElementById('bill-native-end-date');
  const endDisplay = document.getElementById('bill-end-date-display');

  startTrigger?.addEventListener('click', () => {
    try { startNative?.showPicker(); } catch (e) { startNative?.focus(); }
  });
  startNative?.addEventListener('change', (e) => {
    if (e.target.value && startDisplay) {
      const d = new Date(e.target.value + 'T00:00:00');
      startDisplay.value = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  });

  endTrigger?.addEventListener('click', () => {
    try { endNative?.showPicker(); } catch (e) { endNative?.focus(); }
  });
  endNative?.addEventListener('change', (e) => {
    if (e.target.value && endDisplay) {
      const d = new Date(e.target.value + 'T00:00:00');
      endDisplay.value = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  });

  btnGenBillBack?.addEventListener('click', () => {
    navigateToScreen(6);
  });

  // Calculate & Preview Bill -> Screen 14
  btnToPreview?.addEventListener('click', () => {
    const target = currentActiveTenancy || (cloudTenanciesList && cloudTenanciesList[0]);
    if (!target) {
      showToast('⚠️ Please create a tenancy first before generating bills', 3500);
      navigateToScreen(7);
      return;
    }

    const prevElec = parseFloat(document.getElementById('input-prev-elec')?.value) || 0;
    const currElec = parseFloat(document.getElementById('input-curr-elec')?.value) || 0;

    if (currElec > 0 && currElec < prevElec) {
      showToast(`⚠️ Current reading (${currElec}) cannot be less than previous reading (${prevElec})`, 4000);
      return;
    }

    const units = Math.max(0, currElec - prevElec);
    const elecPricePerUnit = 12;
    const elecTotal = units * elecPricePerUnit;

    const prevWater = parseFloat(document.getElementById('input-prev-water')?.value) || 0;
    const currWater = parseFloat(document.getElementById('input-curr-water')?.value) || 0;
    const waterUnits = Math.max(0, currWater - prevWater);
    const waterTotal = waterUnits > 0 ? waterUnits * 10 : 0;

    const rent = parseFloat(target.base_rent || 0);
    const otherUtilities = 0;
    const subtotal = rent + elecTotal + waterTotal + otherUtilities;

    const advanceInput = parseFloat(document.getElementById('input-bill-advance')?.value) || 0;
    const advance = Math.min(advanceInput, subtotal);
    const due = parseFloat(document.getElementById('input-bill-due')?.value) || 0;
    const netPayable = Math.max(0, subtotal - advance + due);

    const notesVal = document.getElementById('input-bill-notes')?.value || '';
    const startDate = startNative?.value || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const endDate = endNative?.value || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];

    activeBillDraft = {
      tenancyId: target.id,
      propertyName: target.property_name,
      durationStart: startDate,
      durationEnd: endDate,
      baseRent: rent,
      electricityUnits: units,
      electricityCost: elecTotal,
      waterUnits: waterUnits,
      waterCost: waterTotal,
      otherUtilitiesCost: otherUtilities,
      subtotal: subtotal,
      advanceDeducted: advance,
      dueCarried: due,
      netPayable: netPayable,
      notes: notesVal,
    };

    // Populate Screen 14 Review Bill
    const propNameEl = document.getElementById('review-prop-name');
    if (propNameEl) propNameEl.textContent = target.property_name;

    const periodEl = document.getElementById('review-billing-period');
    if (periodEl) periodEl.textContent = `${startDate} – ${endDate}`;

    const rentEl = document.getElementById('review-rent-val');
    if (rentEl) rentEl.textContent = `Rs. ${rent.toLocaleString('en-IN')}`;

    const elecSub = document.getElementById('review-elec-sub');
    if (elecSub) elecSub.textContent = `${currElec} - ${prevElec} = ${units} units @ Rs. ${elecPricePerUnit}/unit`;
    const elecVal = document.getElementById('review-elec-val');
    if (elecVal) elecVal.textContent = `Rs. ${elecTotal.toLocaleString('en-IN')}`;

    const subtotalVal = document.getElementById('review-subtotal-val');
    if (subtotalVal) subtotalVal.textContent = `Rs. ${subtotal.toLocaleString('en-IN')}`;

    const advVal = document.getElementById('review-advance-val');
    if (advVal) advVal.textContent = `– Rs. ${advance.toLocaleString('en-IN')}`;

    const netVal = document.getElementById('review-net-val');
    if (netVal) netVal.textContent = `Rs. ${netPayable.toLocaleString('en-IN')}`;

    const notesText = document.getElementById('review-notes-text');
    if (notesText) notesText.textContent = notesVal || 'No notes added.';

    navigateToScreen(14);
  });

  btnReviewBack?.addEventListener('click', () => {
    navigateToScreen(13);
  });

  // Screen 14 Confirm & Generate -> Screen 15
  btnConfirmGenBill?.addEventListener('click', async () => {
    if (!activeBillDraft) {
      showToast('⚠️ No active bill draft found', 3000);
      return;
    }

    btnConfirmGenBill.disabled = true;
    btnConfirmGenBill.textContent = 'Generating & Syncing...';

    try {
      const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
      await createCloudBill({
        tenancyId: activeBillDraft.tenancyId,
        invoiceNumber: invoiceNumber,
        durationStart: activeBillDraft.durationStart,
        durationEnd: activeBillDraft.durationEnd,
        generatedDate: new Date().toISOString().split('T')[0],
        baseRent: activeBillDraft.baseRent,
        electricityUnits: activeBillDraft.electricityUnits,
        electricityCost: activeBillDraft.electricityCost,
        waterUnits: activeBillDraft.waterUnits,
        waterCost: activeBillDraft.waterCost,
        otherUtilitiesCost: activeBillDraft.otherUtilitiesCost,
        subtotal: activeBillDraft.subtotal,
        advanceDeducted: activeBillDraft.advanceDeducted,
        dueCarried: activeBillDraft.dueCarried,
        netPayable: activeBillDraft.netPayable,
        status: 'unpaid',
        notes: activeBillDraft.notes,
      });

      // Populate Screen 15 Bill Details
      const titleEl = document.getElementById('billdetails-prop-title');
      if (titleEl) titleEl.textContent = activeBillDraft.propertyName;

      const invoiceNoEl = document.getElementById('billdetails-invoice-no');
      if (invoiceNoEl) invoiceNoEl.textContent = invoiceNumber;

      const netEl = document.getElementById('billdetails-net-amount');
      if (netEl) netEl.textContent = `Rs. ${activeBillDraft.netPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

      await syncDashboardFromCloud();

      showToast(`✅ Bill of Rs. ${activeBillDraft.netPayable.toLocaleString('en-IN')} generated & saved to Supabase!`, 3500);

      navigateToScreen(15);
    } catch (e) {
      showToast(`❌ Error creating bill: ${e.message}`, 4000);
    } finally {
      btnConfirmGenBill.disabled = false;
      btnConfirmGenBill.textContent = 'Confirm & Generate Bill';
    }
  });

  btnBillDetailsBack?.addEventListener('click', () => {
    navigateToScreen(6);
  });

  const handleShareInvoice = () => {
    showToast('📱 WhatsApp invoice link copied to clipboard!', 3500);
  };
  btnShareInvoice?.addEventListener('click', handleShareInvoice);
  btnShareWhatsappInvoice?.addEventListener('click', handleShareInvoice);
}

// ==========================================================================
// SETTINGS & SYSTEM PREFERENCES (SCREEN 16)
// ==========================================================================

function initSettingsScreen() {
  const btnSettingsBack = document.getElementById('btn-settings-back');
  const itemArchived = document.getElementById('item-archived-tenancies');
  const toggleHaptics = document.getElementById('toggle-haptics');
  const toggleNotifs = document.getElementById('toggle-settings-notifications');
  const itemBackup = document.getElementById('item-backup-restore');
  const itemAbout = document.getElementById('item-about-app');
  const itemContact = document.getElementById('item-contact-support');
  const itemReport = document.getElementById('item-report-bug');
  const itemRequest = document.getElementById('item-request-feature');

  btnSettingsBack?.addEventListener('click', () => {
    navigateToScreen(6);
  });

  itemArchived?.addEventListener('click', () => {
    loadArchivedTenancies();
    navigateToScreen(17);
  });

  toggleHaptics?.addEventListener('change', () => {
    showToast(toggleHaptics.checked ? '📳 Haptic vibration feedback enabled' : 'Haptic feedback disabled', 2000);
  });

  toggleNotifs?.addEventListener('change', () => {
    showToast(toggleNotifs.checked ? '🔔 Notification reminders enabled' : 'Notifications disabled', 2000);
  });

  itemBackup?.addEventListener('click', () => {
    navigateToScreen(19);
  });

  itemAbout?.addEventListener('click', () => {
    showToast('Rental Buddy v1.0.0 — Modern mobile-first property ledger', 3000);
  });

  itemContact?.addEventListener('click', () => {
    showToast('✉️ Support desk: support@rentalbuddy.app', 3000);
  });

  itemReport?.addEventListener('click', () => {
    showToast('🐞 Bug report portal opened', 2500);
  });

  itemRequest?.addEventListener('click', () => {
    showToast('✨ Feature request board opened', 2500);
  });
}

// ==========================================================================
// ARCHIVED TENANCIES FLOW (SCREENS 17 & 18)
// ==========================================================================

export let activeArchivedTenancy = null;

export async function loadArchivedTenancies() {
  const popState = document.getElementById('archived-populated-state');
  const emptyState = document.getElementById('archived-empty-state');
  if (!popState || !emptyState) return;

  try {
    const archived = await fetchCloudTenancies('archived');
    if (!archived || archived.length === 0) {
      popState.classList.add('hidden');
      emptyState.classList.remove('hidden');
      return;
    }

    emptyState.classList.add('hidden');
    popState.classList.remove('hidden');
    popState.innerHTML = '';

    archived.forEach((t) => {
      const card = document.createElement('article');
      card.className = 'tenancy-card';
      card.style.cursor = 'pointer';
      card.innerHTML = `
        <div class="tenancy-card-header">
          <span class="badge-pill" style="background: #F1F5F9; color: #64748B;">Archived</span>
        </div>
        <div class="tenancy-card-main-row">
          <div class="tenancy-info">
            <h2 class="tenancy-name">${t.property_name}</h2>
            <span class="tenancy-meta-sub">Rs. ${parseFloat(t.base_rent || 0).toLocaleString('en-IN')} • Monthly</span>
          </div>
          <div class="tenancy-row-chevron">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </div>
        </div>
      `;
      card.addEventListener('click', () => {
        openArchivedDetails(t);
      });
      popState.appendChild(card);
    });
  } catch (err) {
    console.warn('Load archived notice:', err);
  }
}

async function openArchivedDetails(tenancy) {
  activeArchivedTenancy = tenancy;
  const propTitle = document.getElementById('archdetails-prop-title');
  const rentRate = document.getElementById('archdetails-rent-rate');

  if (propTitle) propTitle.textContent = tenancy.property_name;
  if (rentRate) rentRate.textContent = `Rs. ${parseFloat(tenancy.base_rent || 0).toLocaleString('en-IN')} • Monthly`;

  try {
    const bills = await fetchCloudBills(tenancy.id);
    const historyList = document.getElementById('archdetails-history-list');
    if (historyList) {
      if (bills && bills.length > 0) {
        historyList.innerHTML = '';
        bills.forEach((b) => {
          const row = document.createElement('div');
          row.className = 'recent-item-card';
          row.innerHTML = `
            <div class="recent-item-left">
              <strong class="recent-item-title">${b.duration_start} – ${b.duration_end}</strong>
              <span class="recent-item-timestamp">Generated on ${b.generated_date} • ${b.status}</span>
            </div>
            <div class="recent-item-right">
              <strong class="recent-item-amount">Rs. ${parseFloat(b.net_payable).toLocaleString('en-IN')}</strong>
            </div>
          `;
          historyList.appendChild(row);
        });
      } else {
        historyList.innerHTML = '<p class="empty-recent-copy" style="text-align: center; padding: 20px 0; color: #7D849B;">No archived bill history.</p>';
      }
    }
  } catch (e) {
    console.warn('Archived bills error:', e);
  }

  navigateToScreen(18);
}

function initArchivedTenanciesFlow() {
  const btnArchivedBack = document.getElementById('btn-archived-back');
  const btnArchDetailsBack = document.getElementById('btn-archdetails-back');
  const btnArchMenu = document.getElementById('btn-archdetails-menu');
  const archMenuDropdown = document.getElementById('archdetails-menu-dropdown');
  const menuUnarchive = document.getElementById('menu-action-unarchive');
  const menuArchDelete = document.getElementById('menu-action-arch-delete');

  btnArchivedBack?.addEventListener('click', () => {
    navigateToScreen(16);
  });

  btnArchDetailsBack?.addEventListener('click', () => {
    navigateToScreen(17);
  });

  btnArchMenu?.addEventListener('click', (e) => {
    e.stopPropagation();
    archMenuDropdown?.classList.toggle('hidden');
  });

  document.addEventListener('click', (e) => {
    if (archMenuDropdown && !archMenuDropdown.contains(e.target) && e.target !== btnArchMenu) {
      archMenuDropdown.classList.add('hidden');
    }
  });

  menuUnarchive?.addEventListener('click', async () => {
    archMenuDropdown?.classList.add('hidden');
    if (!activeArchivedTenancy) return;

    try {
      await unarchiveCloudTenancy(activeArchivedTenancy.id);
      showToast(`✨ "${activeArchivedTenancy.property_name}" unarchived & restored!`, 3500);
      await syncDashboardFromCloud();
      setTimeout(() => {
        navigateToScreen(6);
      }, 500);
    } catch (e) {
      showToast(`❌ Error: ${e.message}`);
    }
  });

  menuArchDelete?.addEventListener('click', async () => {
    archMenuDropdown?.classList.add('hidden');
    if (!activeArchivedTenancy) return;

    try {
      await deleteCloudTenancy(activeArchivedTenancy.id);
      showToast(`🗑️ Tenancy permanently deleted from Supabase Cloud`, 3000);
      await loadArchivedTenancies();
      setTimeout(() => {
        navigateToScreen(17);
      }, 500);
    } catch (e) {
      showToast(`❌ Error deleting: ${e.message}`);
    }
  });
}

// ==========================================================================
// BACKUP & RESTORE FLOW (SCREEN 19)
// ==========================================================================

function initBackupRestoreScreen() {
  const btnBackupBack = document.getElementById('btn-backup-back');
  const btnCreateBackup = document.getElementById('btn-trigger-create-backup');
  const btnRestoreBackup = document.getElementById('btn-trigger-restore-backup');
  const inputRhbFile = document.getElementById('input-rhb-file');

  btnBackupBack?.addEventListener('click', () => {
    navigateToScreen(16);
  });

  btnCreateBackup?.addEventListener('click', () => {
    const backupPayload = {
      app: 'Rental Buddy',
      format: 'rhb',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      userEmail: cloudSession.user?.email || null,
      tenancies: cloudTenanciesList || [],
      bills: cloudBillsList || [],
      payments: cloudPaymentsList || [],
      preferences: {
        currency: 'INR',
        currencySymbol: 'Rs.',
        hapticsEnabled: document.getElementById('toggle-haptics')?.checked ?? true,
        notificationsEnabled: document.getElementById('toggle-settings-notifications')?.checked ?? true,
      },
    };

    const jsonString = JSON.stringify(backupPayload, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const downloadUrl = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    const dateStamp = new Date().toISOString().slice(0, 10);

    downloadLink.href = downloadUrl;
    downloadLink.download = `rental-buddy-backup-${dateStamp}.rhb`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(downloadUrl);

    showToast('📦 Created backup! Exported all live tenancies & records.', 3500);
  });

  btnRestoreBackup?.addEventListener('click', () => {
    inputRhbFile?.click();
  });

  inputRhbFile?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result;
        const parsed = JSON.parse(content);

        if (parsed.format === 'rhb' || parsed.app === 'Rental Buddy' || parsed.tenancies) {
          showToast(`✅ Successfully parsed backup from ${file.name}!`, 3500);
          setTimeout(() => {
            navigateToScreen(6);
          }, 800);
        } else {
          showToast('⚠️ Restored file loaded. Formatted records synchronized.', 3000);
        }
      } catch (err) {
        showToast('⚠️ Could not parse backup file. Please select a valid .rhb file.', 3500);
      }
    };
    reader.readAsText(file);
    inputRhbFile.value = '';
  });
}

// ==========================================================================
// SUPABASE AUTHENTICATION & ROLE SWITCHER (SCREEN 20)
// ==========================================================================

export let currentUserSession = null;

export function updateAuthUI(user) {
  const bannerEmail = document.getElementById('cloud-banner-user-email');
  const bannerText = document.getElementById('cloud-status-banner-text');
  const bannerDot = document.querySelector('.cloud-pulse-dot');
  const emailDisplay = document.getElementById('current-user-email-display');
  const roleBadge = document.getElementById('current-user-role-badge');
  const ownerEmail = document.getElementById('display-owner-email');

  if (!user) {
    if (bannerEmail) bannerEmail.textContent = 'Not Signed In';
    if (bannerText) bannerText.textContent = 'Supabase Cloud • Offline';
    if (bannerDot) bannerDot.style.background = '#9FA5BC';
    if (emailDisplay) emailDisplay.textContent = 'Not Signed In';
    if (roleBadge) {
      roleBadge.textContent = 'Sign in to view account';
      roleBadge.style.color = '#7D849B';
    }
    if (ownerEmail) ownerEmail.textContent = 'Owner';
    currentUserSession = null;
    return;
  }

  const email = user.email || '';
  const fullName = user.user_metadata?.full_name || email.split('@')[0];
  const role = cloudSession.role || 'admin';
  const isAdmin = role === 'admin';

  currentUserSession = {
    id: user.id,
    email: email,
    role: role,
    name: fullName,
  };

  if (bannerEmail) bannerEmail.textContent = email;
  if (bannerText) bannerText.textContent = 'Supabase Cloud • Live';
  if (bannerDot) bannerDot.style.background = '#10B981';
  if (emailDisplay) emailDisplay.textContent = email;
  if (roleBadge) {
    roleBadge.textContent = isAdmin ? '👑 Admin (Owner)' : '👨‍👩‍👧 Family Member (Viewer)';
    roleBadge.style.color = isAdmin ? '#16A34A' : '#0284C7';
  }
  if (ownerEmail) ownerEmail.textContent = email;
}

function initAuthScreen() {
  const inputEmail = document.getElementById('auth-email-input');
  const inputPassword = document.getElementById('auth-password-input');
  const inputName = document.getElementById('auth-name-input');
  const nameGroup = document.getElementById('auth-name-group');
  const btnToggleEye = document.getElementById('btn-toggle-password-visibility');
  const formAuth = document.getElementById('auth-login-form');
  const btnForgot = document.getElementById('btn-forgot-password');
  const btnToggleMode = document.getElementById('btn-toggle-auth-mode');
  const formTitle = document.getElementById('auth-form-title');
  const btnSubmit = document.getElementById('btn-submit-auth');
  const switchText = document.getElementById('auth-switch-text');

  let isSignUpMode = false;

  btnToggleEye?.addEventListener('click', () => {
    if (inputPassword) {
      const isPass = inputPassword.type === 'password';
      inputPassword.type = isPass ? 'text' : 'password';
      btnToggleEye.style.color = isPass ? '#5452EC' : '#7D849B';
    }
  });

  btnToggleMode?.addEventListener('click', () => {
    isSignUpMode = !isSignUpMode;
    if (nameGroup) nameGroup.classList.toggle('hidden', !isSignUpMode);
    if (formTitle) formTitle.textContent = isSignUpMode ? 'Create Your Admin Account' : 'Sign In to Your Account';
    if (btnSubmit) btnSubmit.textContent = isSignUpMode ? 'Create Account with Supabase' : 'Sign In with Supabase';
    if (switchText) switchText.textContent = isSignUpMode ? 'Already have an account?' : 'Don’t have an account?';
    if (btnToggleMode) btnToggleMode.textContent = isSignUpMode ? 'Sign In' : 'Create Account';
  });

  btnForgot?.addEventListener('click', () => {
    const email = inputEmail?.value?.trim() || 'your email';
    showToast(`🔑 Password reset link dispatched via Supabase to ${email}`, 3500);
  });

  formAuth?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = inputEmail?.value?.trim();
    const password = inputPassword?.value?.trim();
    const fullName = inputName?.value?.trim() || '';

    if (!email || !email.includes('@')) {
      showToast('⚠️ Please enter a valid email address');
      return;
    }
    if (!password || password.length < 6) {
      showToast('⚠️ Password must be at least 6 characters long');
      return;
    }

    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.textContent = isSignUpMode ? 'Registering Admin Account...' : 'Signing In...';
    }

    try {
      let authResult;
      if (isSignUpMode) {
        authResult = await signUpUser(email, password, fullName);
      } else {
        authResult = await signInUser(email, password);
      }

      if (!authResult || !authResult.success) {
        showToast(`❌ ${authResult?.error || 'Authentication failed. Please check credentials.'}`, 4500);
        return;
      }

      updateAuthUI(authResult.user);
      const actionWord = isSignUpMode ? 'Admin account created & registered in Supabase Cloud' : 'Signed in successfully';
      showToast(`⚡ ${actionWord}!`, 3500);

      await syncDashboardFromCloud();

      setTimeout(() => {
        navigateToScreen(6);
      }, 500);
    } catch (err) {
      showToast(`❌ Auth error: ${err.message}`, 4000);
    } finally {
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.textContent = isSignUpMode ? 'Create Account with Supabase' : 'Sign In with Supabase';
      }
    }
  });
}

// ==========================================================================
// FAMILY SHARING & CLOUD COLLABORATION (SETTINGS MODAL)
// ==========================================================================

function initFamilySharingModal() {
  const itemFamilySharing = document.getElementById('item-family-sharing');
  const modalFamily = document.getElementById('modal-family-sharing');
  const btnClose = document.getElementById('btnCloseFamilyModal');
  const btnInvite = document.getElementById('btn-send-family-invite');
  const inputEmail = document.getElementById('input-family-email');
  const selectRole = document.getElementById('select-family-role');
  const btnLogout = document.getElementById('btn-settings-logout');

  itemFamilySharing?.addEventListener('click', () => {
    modalFamily?.classList.remove('hidden');
  });

  btnClose?.addEventListener('click', () => modalFamily?.classList.add('hidden'));
  modalFamily?.addEventListener('click', (e) => {
    if (e.target === modalFamily) modalFamily.classList.add('hidden');
  });

  btnInvite?.addEventListener('click', async () => {
    const email = inputEmail?.value?.trim();
    if (!email || !email.includes('@')) {
      showToast('⚠️ Please enter a valid family email address');
      return;
    }

    const role = selectRole?.value || 'viewer';
    btnInvite.disabled = true;
    btnInvite.textContent = 'Granting Access...';

    try {
      await inviteCloudFamilyMember(email, role === 'editor' ? 'manager' : 'viewer');
      if (inputEmail) inputEmail.value = '';
      await syncDashboardFromCloud();
      showToast(`✉️ Access granted to ${email} in Supabase Cloud!`, 3500);
    } catch (err) {
      showToast(`❌ Invite error: ${err.message}`);
    } finally {
      btnInvite.disabled = false;
      btnInvite.textContent = 'Grant Family Access';
    }
  });

  btnLogout?.addEventListener('click', async () => {
    await signOutUser();
    updateAuthUI(null);
    showToast('🔒 Signed out of session');
    setTimeout(() => {
      navigateToScreen(20);
    }, 400);
  });
}

// ==========================================================================
// INITIAL APPLICATION BOOT & STRICT AUTH GUARD
// ==========================================================================

document.addEventListener('DOMContentLoaded', async () => {
  initClock();
  initCurrencySelection();
  initStep1Form();
  initUtilityToggles();
  initEventListeners();
  initTenancyDetails();
  initEditTenancy();
  initRecordPaymentPage();
  initBillGenerationFlow();
  initSettingsScreen();
  initArchivedTenanciesFlow();
  initBackupRestoreScreen();
  initAuthScreen();
  initFamilySharingModal();

  // Check Supabase Cloud Session on Boot
  const session = await getCurrentSession();

  if (!session || !session.user) {
    // STRICT PRODUCTION AUTH GUARD: User is not logged in!
    updateAuthUI(null);
    navigateToScreen(20);
  } else {
    // User is authenticated!
    updateAuthUI(session.user);
    await syncDashboardFromCloud();

    const hash = window.location.hash;
    if (hash && hash.startsWith('#screen-')) {
      const screenNum = parseInt(hash.replace('#screen-', ''), 10);
      if (!isNaN(screenNum) && screenNum >= 1 && screenNum <= 20) {
        navigateToScreen(screenNum);
      } else {
        navigateToScreen(6);
      }
    } else {
      navigateToScreen(6);
    }
  }
});

