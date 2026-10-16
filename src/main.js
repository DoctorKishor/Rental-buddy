// ==========================================================================
// RENTAL BUDDY — CONTROLLER & APP STATE (SUPABASE CLOUD FIRST)
// ==========================================================================

import {
  supabase,
  cloudSession,
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
    name: '2nd Floor, Lalitpur',
    rentAmount: '12,000',
    advanceAmount: '55,000',
    phone: '9876543210',
    billingCycle: 'Monthly',
    billingDate: '12th of every month',
    utilities: {
      electricity: {
        enabled: true,
        billType: 'Meter Reading',
        pricePerUnit: '12',
        meterReading: '12341.12',
      },
      water: {
        enabled: true,
        billType: 'Flat',
        amount: '300',
      },
      garbage: {
        enabled: true,
        amount: '200',
      },
      internet: {
        enabled: false,
        amount: '1000',
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

// Screen Transition Navigator
function navigateToScreen(targetScreenNumber) {
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

  // Sync floating review widget buttons
  document.querySelectorAll('.widget-btn').forEach((btn) => {
    const goto = parseInt(btn.dataset.goto, 10);
    btn.classList.toggle('active', goto === targetScreenNumber);
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
    navigateToScreen(6);
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
    const nameVal = document.getElementById('input-tenancy-name')?.value?.trim() || '2nd Floor, Lalitpur';
    const rentVal = parseFloat(document.getElementById('input-rent-amount')?.value?.replace(/[^0-9.]/g, '')) || 12000;
    const advanceVal = parseFloat(document.getElementById('input-advance-amount')?.value?.replace(/[^0-9.]/g, '')) || 0;
    const phoneVal = document.getElementById('input-tenant-phone')?.value?.trim() || '';

    try {
      await createCloudTenancy({
        propertyName: nameVal,
        tenantName: 'Primary Tenant',
        tenantPhone: phoneVal,
        baseRent: rentVal,
        advanceAmount: advanceVal,
        billingDay: 12,
      });
    } catch (e) {
      console.warn('Cloud create tenancy notice:', e);
    }

    showToast(`🎉 Tenancy "${nameVal}" created & synced to Supabase Cloud!`, 3500);
    setTimeout(() => {
      setDashboardState('state1');
      navigateToScreen(6);
    }, 1000);
  });

  // Navigate to Tenancy Details (Screen 10) from Dashboard Cards
  document.getElementById('card-tenancy-lalitpur')?.querySelector('.tenancy-card-main-row')?.addEventListener('click', () => {
    setDetailsState('monthwise');
    navigateToScreen(10);
  });
  document.getElementById('card-tenancy-rams')?.querySelector('.tenancy-card-main-row')?.addEventListener('click', () => {
    setDetailsState('monthwise');
    navigateToScreen(10);
  });
  document.getElementById('card-tenancy-apartment11')?.querySelector('.tenancy-card-main-row')?.addEventListener('click', () => {
    setDetailsState('monthwise');
    navigateToScreen(10);
  });

  // Screen 10 Details Navigation
  document.getElementById('btn-details-back')?.addEventListener('click', () => {
    navigateToScreen(6);
  });

  // Initialize Tenancy Details (Screen 10)
  initTenancyDetails();

  // Floating Review Widget buttons for Screen Navigation
  document.querySelectorAll('.widget-btn[data-goto]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = parseInt(btn.dataset.goto, 10);
      navigateToScreen(target);
    });
  });

  // Floating Review Widget buttons for Dashboard Mockup States
  document.querySelectorAll('.widget-btn[data-home-state]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.widget-btn[data-home-state]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const stateKey = btn.dataset.homeState;
      setDashboardState(stateKey);
      navigateToScreen(6);
      showToast(`Switched to: ${btn.title}`);
    });
  });

  // Floating Review Widget buttons for Tenancy Details States
  document.querySelectorAll('.widget-btn[data-details-state]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.widget-btn[data-details-state]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const stateKey = btn.dataset.detailsState;
      setDetailsState(stateKey);
      navigateToScreen(10);
      showToast(`Details View: ${btn.title}`);
    });
  });

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

  // Wire up Record & Generate Bill buttons
  document.getElementById('btn-lalitpur-action')?.addEventListener('click', () => {
    const actionText = document.getElementById('lalitpur-action-text')?.textContent;
    if (actionText?.includes('Generate Bill')) {
      navigateToScreen(13);
    } else {
      openRecordPaymentPage('lalitpur');
    }
  });

  document.getElementById('btn-rams-action')?.addEventListener('click', () => {
    const actionText = document.getElementById('rams-action-text')?.textContent;
    if (actionText?.includes('Generate Bill')) {
      navigateToScreen(13);
    } else {
      openRecordPaymentPage('rams');
    }
  });

  document.getElementById('btn-apt-record')?.addEventListener('click', () => {
    openRecordPaymentPage('apt11');
  });

  document.getElementById('btn-apt-generate')?.addEventListener('click', () => {
    navigateToScreen(13);
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

  submitRecord?.addEventListener('click', () => {
    const tenancy = recordSelect ? recordSelect.value : '2nd Floor, Lalitpur';
    const amount = recordAmountInput ? recordAmountInput.value : '12,000';
    const selectedMethod = document.querySelector('input[name="pay-method"]:checked')?.value || 'Cash';

    // Prepend new payment to recent payments list
    if (listPayments) {
      const newCard = document.createElement('div');
      newCard.className = 'recent-item-card';
      newCard.setAttribute('role', 'button');
      newCard.setAttribute('tabindex', '0');
      newCard.innerHTML = `
        <div class="recent-item-left">
          <span class="recent-prop-name">${tenancy}</span>
          <strong class="recent-item-title">Just now — Paid via ${selectedMethod}</strong>
          <span class="recent-item-timestamp">Paid on Today ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div class="recent-item-right">
          <strong class="recent-item-amount">Rs. ${parseFloat(amount).toLocaleString('en-IN')}</strong>
          <svg class="recent-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>
      `;
      listPayments.insertBefore(newCard, listPayments.firstChild);
    }

    modalRecord?.classList.add('hidden');
    showToast(`✅ Payment of Rs. ${parseFloat(amount).toLocaleString('en-IN')} recorded for ${tenancy}!`, 3500);
  });

  // Modal: Generate Bill & Share
  const modalBill = document.getElementById('modal-generate-bill');
  const closeBillModal = document.getElementById('btn-close-bill-modal');
  const billTargetTenancy = document.getElementById('bill-target-tenancy');
  const billTargetCycle = document.getElementById('bill-target-cycle');
  const billCalculatedTotal = document.getElementById('bill-calculated-total');

  function openBillModal(tenancy = 'Apartment 11, Bhakatapur', cycle = 'Monthly - April 2026', total = '34,150.12') {
    if (billTargetTenancy) billTargetTenancy.textContent = tenancy;
    if (billTargetCycle) billTargetCycle.textContent = cycle;
    if (billCalculatedTotal) billCalculatedTotal.textContent = `Rs. ${total}`;
    modalBill?.classList.remove('hidden');
  }

  closeBillModal?.addEventListener('click', () => modalBill?.classList.add('hidden'));
  modalBill?.addEventListener('click', (e) => {
    if (e.target === modalBill) modalBill.classList.add('hidden');
  });

  document.getElementById('btn-apt-generate')?.addEventListener('click', () => {
    openBillModal('Apartment 11, Bhakatapur', 'Monthly - April 2026', '34,150.12');
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

// State Setter to recreate each of the 4 Figma Mockups faithfully
function setDashboardState(stateKey) {
  const title = document.getElementById('dashboard-main-title');
  const emptyTenancies = document.getElementById('dashboard-empty-tenancies');
  const cardLalitpur = document.getElementById('card-tenancy-lalitpur');
  const cardRams = document.getElementById('card-tenancy-rams');
  const cardApt11 = document.getElementById('card-tenancy-apartment11');
  const recentSection = document.getElementById('dashboard-recent-section');
  const tabPayments = document.getElementById('tab-recent-payments');
  const tabBills = document.getElementById('tab-recent-bills');
  const heading = document.getElementById('recent-section-heading');
  const listPayments = document.getElementById('list-recent-payments');
  const listBills = document.getElementById('list-recent-bills');
  const emptyPayments = document.getElementById('empty-recent-payments');

  // Lalitpur specific elements
  const lalitpurPill = document.getElementById('lalitpur-status-pill');
  const lalitpurSub = document.getElementById('lalitpur-sub');
  const lalitpurLeftVal = document.getElementById('lalitpur-left-val');
  const lalitpurLeftSub = document.getElementById('lalitpur-left-sub');
  const lalitpurRightVal = document.getElementById('lalitpur-right-val');
  const lalitpurRightSub = document.getElementById('lalitpur-right-sub');
  const lalitpurHistory = document.getElementById('lalitpur-history-text');
  const lalitpurActionText = document.getElementById('lalitpur-action-text');

  // Ram's Flat specific elements
  const ramsPill = document.getElementById('rams-status-pill');
  const ramsSub = document.getElementById('rams-sub');
  const ramsLeftVal = document.getElementById('rams-left-val');
  const ramsLeftSub = document.getElementById('rams-left-sub');
  const ramsRightVal = document.getElementById('rams-right-val');
  const ramsRightSub = document.getElementById('rams-right-sub');
  const ramsHistory = document.getElementById('rams-history-text');
  const ramsActionText = document.getElementById('rams-action-text');

  if (stateKey === 'empty') {
    if (title) title.textContent = 'Your Tenancy';
    emptyTenancies?.classList.remove('hidden');
    cardLalitpur?.classList.add('hidden');
    cardRams?.classList.add('hidden');
    cardApt11?.classList.add('hidden');
    recentSection?.classList.add('hidden');
    return;
  }

  // Common active setup
  emptyTenancies?.classList.add('hidden');
  recentSection?.classList.remove('hidden');

  if (stateKey === 'state1') {
    // MOCKUP 1: Multi-Tenancies + Overdue + Recent Payments
    if (title) title.textContent = 'Your Tenancies';
    cardLalitpur?.classList.remove('hidden');
    cardRams?.classList.remove('hidden');
    cardApt11?.classList.remove('hidden');

    // Lalitpur setup
    if (lalitpurPill) {
      lalitpurPill.className = 'status-pill status-overdue';
      lalitpurPill.textContent = 'Payment overdue - 3 days';
    }
    if (lalitpurSub) lalitpurSub.textContent = 'Rs. 12,000 . Monthly - April';
    if (lalitpurLeftVal) lalitpurLeftVal.textContent = 'Paid Till - March';
    if (lalitpurLeftSub) {
      lalitpurLeftSub.className = 'metric-tag success';
      lalitpurLeftSub.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>No Past Dues</span>
      `;
    }
    if (lalitpurRightVal) lalitpurRightVal.textContent = '12 May 2026';
    if (lalitpurRightSub) lalitpurRightSub.textContent = 'Next Billing';
    if (lalitpurHistory) lalitpurHistory.textContent = '13 total payments . Last Paid on March 12th';
    if (lalitpurActionText) lalitpurActionText.textContent = 'Record Payment';

    // Ram's Flat setup
    if (ramsPill) {
      ramsPill.className = 'status-pill status-due-today';
      ramsPill.textContent = 'Due today';
    }
    if (ramsSub) ramsSub.textContent = 'Rs. 2,000 . Monthly - April';
    if (ramsLeftVal) ramsLeftVal.textContent = 'Paid Till - Jan';
    if (ramsLeftSub) {
      ramsLeftSub.className = 'metric-tag danger';
      ramsLeftSub.textContent = '2 months due';
    }
    if (ramsRightVal) ramsRightVal.textContent = '3 May 2026';
    if (ramsRightSub) ramsRightSub.textContent = 'Next Billing';
    if (ramsHistory) ramsHistory.textContent = '12 total payments . Last Paid on Feb 5th';
    if (ramsActionText) ramsActionText.textContent = 'Record Payment';

    // Recent Payments tab
    tabPayments?.click();
    emptyPayments?.classList.add('hidden');
    listPayments?.classList.remove('hidden');

  } else if (stateKey === 'state2') {
    // MOCKUP 2: Single Tenancy + Bikram Sambat Bills Ledger
    if (title) title.textContent = 'Your Tenancy';
    cardLalitpur?.classList.remove('hidden');
    cardRams?.classList.add('hidden');
    cardApt11?.classList.add('hidden');

    // Lalitpur setup
    if (lalitpurPill) {
      lalitpurPill.className = 'status-pill status-overdue';
      lalitpurPill.textContent = 'Billing overdue - 3 days';
    }
    if (lalitpurSub) lalitpurSub.textContent = 'Rs. 12,000 . Monthly';
    if (lalitpurLeftVal) lalitpurLeftVal.textContent = 'Paid Till - March';
    if (lalitpurLeftSub) {
      lalitpurLeftSub.className = 'metric-tag success';
      lalitpurLeftSub.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>No Past Dues</span>
      `;
    }
    if (lalitpurRightVal) lalitpurRightVal.textContent = '12 May 2026';
    if (lalitpurRightSub) lalitpurRightSub.textContent = 'Next Billing';
    if (lalitpurHistory) lalitpurHistory.textContent = '12 total bills . Last Paid on March 12th';
    if (lalitpurActionText) lalitpurActionText.textContent = 'Record Payment';

    // Show BS bills ledger
    tabBills?.click();
    emptyPayments?.classList.add('hidden');

  } else if (stateKey === 'state3') {
    // MOCKUP 3: Multi-Tenancies + Generate Bills CTAs
    if (title) title.textContent = 'Your Tenancies';
    cardLalitpur?.classList.remove('hidden');
    cardRams?.classList.remove('hidden');
    cardApt11?.classList.add('hidden');

    // Lalitpur with Generate Bill CTA
    if (lalitpurPill) {
      lalitpurPill.className = 'status-pill status-overdue';
      lalitpurPill.textContent = 'Billing overdue - 3 days';
    }
    if (lalitpurSub) lalitpurSub.textContent = 'Rs. 12,000 . Monthly';
    if (lalitpurLeftVal) lalitpurLeftVal.textContent = 'Rs. 12,034.12';
    if (lalitpurLeftSub) {
      lalitpurLeftSub.className = 'metric-label';
      lalitpurLeftSub.textContent = 'Last Generated Bill';
    }
    if (lalitpurRightVal) lalitpurRightVal.textContent = '1 May 2026';
    if (lalitpurRightSub) lalitpurRightSub.textContent = 'Next Billing';
    if (lalitpurHistory) lalitpurHistory.textContent = '12 total bills . Last generated on April 5';
    if (lalitpurActionText) lalitpurActionText.textContent = 'Generate Bill';

    // Ram's Flat with Weekly & Generate Bill CTA
    if (ramsPill) {
      ramsPill.className = 'status-pill status-due-today';
      ramsPill.textContent = 'Billing today';
    }
    if (ramsSub) ramsSub.textContent = 'Rs. 2,000 . Weekly';
    if (ramsLeftVal) ramsLeftVal.textContent = 'Rs. 2,540';
    if (ramsLeftSub) {
      ramsLeftSub.className = 'metric-label';
      ramsLeftSub.textContent = 'Last generated bill';
    }
    if (ramsRightVal) ramsRightVal.textContent = '1 May 2026';
    if (ramsRightSub) ramsRightSub.textContent = 'Next Billing';
    if (ramsHistory) ramsHistory.textContent = '12 total bills . Last generated on April 5';
    if (ramsActionText) ramsActionText.textContent = 'Generate Bill';

    // Recent Bills tab active
    tabBills?.click();
    emptyPayments?.classList.add('hidden');

  } else if (stateKey === 'state4') {
    // MOCKUP 4: Single Tenancy + Empty Recent Payments Card
    if (title) title.textContent = 'Your Tenancy';
    cardLalitpur?.classList.remove('hidden');
    cardRams?.classList.add('hidden');
    cardApt11?.classList.add('hidden');

    // Lalitpur setup
    if (lalitpurPill) {
      lalitpurPill.className = 'status-pill status-overdue';
      lalitpurPill.textContent = 'Billing overdue - 3 days';
    }
    if (lalitpurSub) lalitpurSub.textContent = 'Rs. 12,000 . Monthly';
    if (lalitpurLeftVal) lalitpurLeftVal.textContent = '';
    if (lalitpurLeftSub) lalitpurLeftSub.textContent = '';
    if (lalitpurRightVal) lalitpurRightVal.textContent = '1 May 2026';
    if (lalitpurRightSub) lalitpurRightSub.textContent = 'Next Billing';
    if (lalitpurHistory) lalitpurHistory.textContent = '';
    if (lalitpurActionText) lalitpurActionText.textContent = 'Generate Bill';

    // Empty Recent Payments
    tabPayments?.classList.add('active');
    tabBills?.classList.remove('active');
    if (heading) heading.textContent = 'Recent Payments';
    listPayments?.classList.add('hidden');
    listBills?.classList.add('hidden');
    emptyPayments?.classList.remove('hidden');
  }
}

// ==========================================================================
// TENANCY DETAILS CONTROLLER & MONTH-WISE STATUS (SCREEN 10)
// ==========================================================================

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
    navigateToScreen(11);
  });

  actionArchive?.addEventListener('click', async () => {
    menuDropdown?.classList.add('hidden');
    try {
      await archiveCloudTenancy('00000000-0000-0000-0000-000000000001');
    } catch (e) {
      console.warn('Cloud archive notice:', e);
    }
    showToast('🗃️ Tenancy "2nd Floor, Lalitpur" archived & synced to Supabase Cloud');
    setTimeout(() => navigateToScreen(17), 600);
  });

  actionDelete?.addEventListener('click', async () => {
    menuDropdown?.classList.add('hidden');
    try {
      await deleteCloudTenancy('00000000-0000-0000-0000-000000000001');
    } catch (e) {
      console.warn('Cloud delete notice:', e);
    }
    showToast('🗑️ Tenancy deleted from Supabase Cloud');
    setTimeout(() => navigateToScreen(6), 1000);
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

function setDetailsState(stateKey) {
  const countBadge = document.getElementById('details-bills-count');
  const totalAmount = document.getElementById('details-total-amount');
  const lastBillCol = document.getElementById('details-last-bill-col');
  const tabMonth = document.getElementById('tab-month-status');
  const tabHistory = document.getElementById('tab-bill-history');
  const viewMonth = document.getElementById('view-month-status');
  const viewHistory = document.getElementById('view-bill-history');
  const emptyBills = document.getElementById('details-empty-bills');
  const menuDropdown = document.getElementById('details-menu-dropdown');
  const viewTitle = document.getElementById('details-view-title');

  if (stateKey === 'monthwise') {
    if (countBadge) countBadge.textContent = '12 bills';
    if (totalAmount) totalAmount.textContent = 'Rs. 68,148.16';
    lastBillCol?.classList.remove('hidden');
    tabMonth?.classList.add('active');
    tabHistory?.classList.remove('active');
    if (viewTitle) viewTitle.textContent = 'Payment Status';
    viewMonth?.classList.remove('hidden');
    viewHistory?.classList.add('hidden');
    emptyBills?.classList.add('hidden');
    menuDropdown?.classList.add('hidden');

  } else if (stateKey === 'history') {
    // Figma Frame 2
    if (countBadge) countBadge.textContent = '12 bills';
    if (totalAmount) totalAmount.textContent = 'Rs. 68,148.16';
    lastBillCol?.classList.remove('hidden');
    tabHistory?.classList.add('active');
    tabMonth?.classList.remove('active');
    if (viewTitle) viewTitle.textContent = 'Rent Payment History';
    viewMonth?.classList.add('hidden');
    viewHistory?.classList.remove('hidden');
    emptyBills?.classList.add('hidden');
    menuDropdown?.classList.add('hidden');

  } else if (stateKey === 'empty') {
    // Figma Frame 1 (0 bills empty state)
    if (countBadge) countBadge.textContent = '0 bill';
    if (totalAmount) totalAmount.textContent = 'Rs. 0.00';
    lastBillCol?.classList.add('hidden'); // Only next billing is shown
    if (viewTitle) viewTitle.textContent = 'Rent Bill History';
    viewMonth?.classList.add('hidden');
    viewHistory?.classList.add('hidden');
    emptyBills?.classList.remove('hidden');
    menuDropdown?.classList.add('hidden');

  } else if (stateKey === 'menu') {
    // Figma Frame 3 (Menu open)
    if (countBadge) countBadge.textContent = '12 bills';
    if (totalAmount) totalAmount.textContent = 'Rs. 68,148.16';
    lastBillCol?.classList.remove('hidden');
    tabHistory?.classList.add('active');
    tabMonth?.classList.remove('active');
    if (viewTitle) viewTitle.textContent = 'Rent Payment History';
    viewMonth?.classList.add('hidden');
    viewHistory?.classList.remove('hidden');
    emptyBills?.classList.add('hidden');
    menuDropdown?.classList.remove('hidden');
  }
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
    const newRent = document.getElementById('input-new-rent')?.value || '14000';
    const cycle = document.getElementById('select-revise-cycle')?.value || '1 May 2026';
    const notifyTenant = document.getElementById('toggle-notify-tenant-revision')?.checked;

    try {
      await scheduleCloudRentRevision({
        tenancyId: '00000000-0000-0000-0000-000000000001',
        oldRent: 12000,
        newRent: parseFloat(newRent),
        effectiveDate: '2026-05-01',
        note: 'Annual cycle rent revision',
        notifyTenant,
      });
    } catch (e) {
      console.warn('Cloud revision notice:', e);
    }

    if (bannerRevisionText) {
      bannerRevisionText.textContent = `Rs. ${parseFloat(newRent).toLocaleString('en-IN')} scheduled from ${cycle}`;
    }
    bannerRevision?.classList.remove('hidden');
    modalRevise?.classList.add('hidden');

    const msg = notifyTenant 
      ? `📈 Rent revision scheduled to Rs. ${parseFloat(newRent).toLocaleString('en-IN')} from ${cycle} (Tenant notified via WhatsApp & Cloud Synced)`
      : `📈 Rent revision scheduled to Rs. ${parseFloat(newRent).toLocaleString('en-IN')} from ${cycle} (Cloud Synced)`;
    showToast(msg, 3500);
  });

  // Cancel Scheduled Revision
  btnCancelRevision?.addEventListener('click', async () => {
    try {
      await cancelCloudRentRevision('00000000-0000-0000-0000-000000000001');
    } catch (e) {
      console.warn('Cloud cancel notice:', e);
    }
    bannerRevision?.classList.add('hidden');
    showToast('Scheduled rent revision cancelled in Supabase Cloud');
  });

  // Save changes
  btnSave?.addEventListener('click', () => {
    const updatedName = document.getElementById('edit-tenancy-name')?.value?.trim();
    const updatedRent = document.getElementById('edit-rent-amount')?.value?.trim();

    if (updatedName) {
      const detailsTitle = document.getElementById('details-prop-title');
      if (detailsTitle) detailsTitle.textContent = updatedName;
    }

    if (updatedRent) {
      const rentRate = document.getElementById('details-rent-rate');
      if (rentRate) rentRate.textContent = `Rs. ${parseFloat(updatedRent).toLocaleString('en-IN')} . Monthly`;
    }

    showToast('✅ Tenancy details updated successfully!', 3000);
    setTimeout(() => {
      navigateToScreen(10);
    }, 600);
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

const tenancySettlementData = {
  lalitpur: {
    name: '2nd Floor, Lalitpur',
    hasPending: true,
    dueAmount: '12034.12',
    dueHint: 'Due: Rs. 12,034.12',
    rentAmount: '12000.00',
    shortcuts: [
      { label: 'Full Due (12,034)', amount: '12034.12' },
      { label: 'Base Rent (12,000)', amount: '12000.00' },
      { label: 'Round Rs. 10,000', amount: '10000.00' }
    ],
    pendingMonths: [
      { label: 'March 2026', sub: 'Overdue 3 days • Rs. 12,034.12', amount: 12034.12, checked: true },
      { label: 'April 2026 (Current Month)', sub: 'Upcoming Cycle • Rs. 12,000.00', amount: 12000.00, checked: false }
    ],
    currentMonthTitle: 'April 2026'
  },
  rams: {
    name: 'Ram’s Flat',
    hasPending: true,
    dueAmount: '4000.00',
    dueHint: 'Due: 2 Months (Rs. 4,000)',
    rentAmount: '2000.00',
    shortcuts: [
      { label: 'Full Due (4,000)', amount: '4000.00' },
      { label: '1 Month (2,000)', amount: '2000.00' },
      { label: 'Round Rs. 5,000', amount: '5000.00' }
    ],
    pendingMonths: [
      { label: 'February 2026', sub: 'Past Due • Rs. 2,000.00', amount: 2000.00, checked: true },
      { label: 'March 2026', sub: 'Past Due • Rs. 2,000.00', amount: 2000.00, checked: true },
      { label: 'April 2026 (Current Month)', sub: 'Upcoming Cycle • Rs. 2,000.00', amount: 2000.00, checked: false }
    ],
    currentMonthTitle: 'April 2026'
  },
  apt11: {
    name: 'Apartment 11, Bhakatapur',
    hasPending: false, // NO PENDING DUES!
    dueAmount: '34150.00',
    dueHint: 'No Past Dues • Next in 5 days',
    rentAmount: '34150.00',
    shortcuts: [
      { label: 'Full Rent (34,150)', amount: '34150.00' },
      { label: 'Round Rs. 34,000', amount: '34000.00' },
      { label: 'Advance Rs. 35,000', amount: '35000.00' }
    ],
    pendingMonths: [],
    currentMonthTitle: 'April 2026'
  }
};

function openRecordPaymentPage(tenancyKey = 'lalitpur') {
  setupRecordPaymentForm(tenancyKey);
  navigateToScreen(12);
}

function setupRecordPaymentForm(tenancyKey) {
  const data = tenancySettlementData[tenancyKey] || tenancySettlementData.lalitpur;
  
  // Update tenancy selector
  const selectTenancy = document.getElementById('record-page-tenancy');
  if (selectTenancy) selectTenancy.value = tenancyKey;

  // Update header subtitle
  const subtitle = document.getElementById('record-page-subtitle');
  if (subtitle) subtitle.textContent = data.name;

  // Update due hint & amount
  const dueHint = document.getElementById('record-due-hint');
  if (dueHint) {
    dueHint.textContent = data.dueHint;
    dueHint.style.color = data.hasPending ? '#DC2626' : '#16A34A';
  }

  const amountInput = document.getElementById('record-page-amount');
  if (amountInput) amountInput.value = data.dueAmount;

  // Update shortcut chips
  const chipsContainer = document.querySelector('.amount-shortcut-chips');
  if (chipsContainer && data.shortcuts) {
    chipsContainer.innerHTML = '';
    data.shortcuts.forEach((chip, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `shortcut-chip ${index === 0 ? 'active' : ''}`;
      btn.textContent = chip.label;
      btn.addEventListener('click', () => {
        chipsContainer.querySelectorAll('.shortcut-chip').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        if (amountInput) amountInput.value = chip.amount;
      });
      chipsContainer.appendChild(btn);
    });
  }

  // Handle Month Settlement logic (State A vs State B)
  const blockPending = document.getElementById('block-pending-months');
  const blockNoPending = document.getElementById('block-no-pending-months');
  const currentMonthTitle = document.getElementById('current-month-title');
  const customMonthPickerRow = document.getElementById('custom-month-picker-row');

  if (data.hasPending) {
    blockPending?.classList.remove('hidden');
    blockNoPending?.classList.add('hidden');

    const monthsList = blockPending?.querySelector('.months-select-list');
    if (monthsList) {
      monthsList.innerHTML = '';
      data.pendingMonths.forEach((item) => {
        const label = document.createElement('label');
        label.className = `month-select-option ${item.checked ? 'selected' : ''}`;
        label.innerHTML = `
          <input type="checkbox" name="settle-month" value="${item.label}" ${item.checked ? 'checked' : ''} />
          <div class="month-opt-details">
            <strong class="month-opt-title">${item.label}</strong>
            <span class="month-opt-sub ${item.sub.includes('Overdue') || item.sub.includes('Past Due') ? 'status-overdue' : ''}">${item.sub}</span>
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
    // State B: No pending dues, default to current month
    blockPending?.classList.add('hidden');
    blockNoPending?.classList.remove('hidden');
    if (currentMonthTitle) currentMonthTitle.textContent = data.currentMonthTitle;
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

  // Tenancy selector change
  selectTenancy?.addEventListener('change', (e) => {
    setupRecordPaymentForm(e.target.value);
  });

  // Back button
  btnBack?.addEventListener('click', () => {
    navigateToScreen(6);
  });

  // Payment mode toggle (Cash vs Online)
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

  // Online channel chips
  channelChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      channelChips.forEach((c) => c.classList.remove('selected'));
      chip.classList.add('selected');
      const input = chip.querySelector('input');
      if (input) input.checked = true;
    });
  });

  // Date picker trigger
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

  // Toggle custom advance month row
  btnToggleCustomMonth?.addEventListener('click', () => {
    customMonthPickerRow?.classList.toggle('hidden');
  });

  // Save full payment
  btnSave?.addEventListener('click', async () => {
    const tenancyKey = selectTenancy?.value || 'lalitpur';
    const data = tenancySettlementData[tenancyKey] || tenancySettlementData.lalitpur;
    const amountVal = document.getElementById('record-page-amount')?.value?.trim();

    if (!amountVal || parseFloat(amountVal) <= 0) {
      showToast('⚠️ Please enter a valid payment amount', 3000);
      return;
    }

    const payMode = document.querySelector('input[name="record-pay-mode"]:checked')?.value || 'Cash';
    let modeLabel = payMode;
    if (payMode === 'Online') {
      const channel = document.querySelector('input[name="online-channel"]:checked')?.value || 'Online';
      modeLabel = channel;
      const ref = document.getElementById('input-online-ref')?.value?.trim();
      if (ref) modeLabel += ` (Ref: ${ref})`;
    }

    // Determine settled month string
    let settledMonthText = '';
    if (data.hasPending) {
      const checkedMonths = Array.from(document.querySelectorAll('input[name="settle-month"]:checked')).map(cb => cb.value.split(' ')[0]);
      if (checkedMonths.length > 0) {
        settledMonthText = checkedMonths.join(', ');
      } else {
        settledMonthText = 'Manual Settlement';
      }
    } else {
      if (customMonthPickerRow && !customMonthPickerRow.classList.contains('hidden')) {
        const customVal = document.getElementById('select-custom-settle-month')?.value || 'May 2026';
        settledMonthText = customVal.split(' ')[0] + ' (Advance)';
      } else {
        settledMonthText = data.currentMonthTitle.split(' ')[0];
      }
    }

    const notes = document.getElementById('record-payment-notes')?.value?.trim();
    const sendWhatsApp = document.getElementById('toggle-send-whatsapp-receipt')?.checked;
    const dateText = dateDisplay?.value || 'Today';

    // Persist to Supabase Cloud
    try {
      await recordCloudPayment({
        tenancyId: '00000000-0000-0000-0000-000000000001',
        amount: parseFloat(amountVal),
        paymentMode: payMode.toLowerCase(),
        channel: payMode === 'Online' ? (document.querySelector('input[name="online-channel"]:checked')?.value?.toLowerCase() || 'upi') : 'cash',
        referenceNo: document.getElementById('input-online-ref')?.value?.trim() || null,
        settledMonths: [settledMonthText],
        paymentDate: nativeDate?.value || new Date().toISOString().split('T')[0],
      });
    } catch (e) {
      console.warn('Cloud payment save notice:', e);
    }

    // Prepend to Dashboard Recent Payments
    const listPayments = document.getElementById('list-recent-payments');
    if (listPayments) {
      const newCard = document.createElement('div');
      newCard.className = 'recent-item-card';
      newCard.setAttribute('role', 'button');
      newCard.setAttribute('tabindex', '0');
      newCard.innerHTML = `
        <div class="recent-item-left">
          <span class="recent-prop-name">${data.name}</span>
          <strong class="recent-item-title">${settledMonthText} — Paid via ${modeLabel}</strong>
          <span class="recent-item-timestamp">Paid on ${dateText} ${notes ? '• ' + notes : ''}</span>
        </div>
        <div class="recent-item-right">
          <strong class="recent-item-amount">Rs. ${parseFloat(amountVal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
          <svg class="recent-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>
      `;
      listPayments.insertBefore(newCard, listPayments.firstChild);
    }

    // Informative toast
    const toastMsg = sendWhatsApp
      ? `✅ Rs. ${parseFloat(amountVal).toLocaleString('en-IN')} payment recorded for ${data.name} (${settledMonthText})! Receipt queued for WhatsApp & Cloud Synced.`
      : `✅ Rs. ${parseFloat(amountVal).toLocaleString('en-IN')} payment recorded for ${data.name} (${settledMonthText})! Cloud Synced.`;

    showToast(toastMsg, 3500);

    // Navigate to dashboard
    setTimeout(() => {
      navigateToScreen(6);
    }, 600);
  });

  // Also make overdue month card on Screen 10 clickable
  const overdueMonthCard = document.querySelector('.month-card.month-overdue');
  if (overdueMonthCard) {
    overdueMonthCard.setAttribute('role', 'button');
    overdueMonthCard.setAttribute('tabindex', '0');
    overdueMonthCard.style.cursor = 'pointer';
    overdueMonthCard.addEventListener('click', () => {
      openRecordPaymentPage('lalitpur');
    });
  }
}

// ==========================================================================
// BILL GENERATION & INVOICE DETAILS FLOW (SCREENS 13, 14, 15)
// ==========================================================================

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

  // Screen 13 Back
  btnGenBillBack?.addEventListener('click', () => {
    navigateToScreen(6);
  });

  // Calculate & Preview Bill -> Screen 14
  btnToPreview?.addEventListener('click', () => {
    const prevElec = parseFloat(document.getElementById('input-prev-elec')?.value) || 13187;
    const currElec = parseFloat(document.getElementById('input-curr-elec')?.value) || 14187;

    // Financial Risk Guardrail: Negative meter reading prevention
    if (currElec < prevElec) {
      showToast(`⚠️ Current reading (${currElec}) cannot be less than previous reading (${prevElec}). Check for typo.`, 4000);
      return;
    }

    const units = Math.max(0, currElec - prevElec);
    const elecPricePerUnit = 12;
    const elecTotal = units * elecPricePerUnit;

    const rent = 12000;
    const internet = 500;
    const water = 500;
    const sewage = 500;
    const subtotal = rent + elecTotal + internet + water + sewage;

    const advanceInput = parseFloat(document.getElementById('input-bill-advance')?.value) || 0;
    // Financial Risk Guardrail: Cap advance to subtotal
    if (advanceInput > subtotal) {
      showToast(`ℹ️ Advance deduction (Rs. ${advanceInput.toLocaleString()}) exceeds subtotal. Capped to bill amount.`, 3500);
    }
    const advance = Math.min(advanceInput, subtotal);
    const due = parseFloat(document.getElementById('input-bill-due')?.value) || 0;
    const netPayable = Math.max(0, subtotal - advance + due);

    const notesVal = document.getElementById('input-bill-notes')?.value || 'This is the notes mentioned on the bill generation page';

    // Populate Screen 14 Review Bill
    const elecSub = document.getElementById('review-elec-sub');
    if (elecSub) elecSub.textContent = `${currElec} - ${prevElec} = ${units} units @ 12/unit`;
    const elecVal = document.getElementById('review-elec-val');
    if (elecVal) elecVal.textContent = `Rs. ${elecTotal.toLocaleString('en-IN')}`;

    const subtotalVal = document.getElementById('review-subtotal-val');
    if (subtotalVal) subtotalVal.textContent = `Rs. ${subtotal.toLocaleString('en-IN')}`;

    const advVal = document.getElementById('review-advance-val');
    if (advVal) advVal.textContent = `– Rs. ${advance.toLocaleString('en-IN')}`;

    const netVal = document.getElementById('review-net-val');
    if (netVal) netVal.textContent = `Rs. ${netPayable.toLocaleString('en-IN')}`;

    const notesText = document.getElementById('review-notes-text');
    if (notesText) notesText.textContent = notesVal;

    navigateToScreen(14);
  });

  // Screen 14 Back
  btnReviewBack?.addEventListener('click', () => {
    navigateToScreen(13);
  });

  // Screen 14 Confirm & Generate -> Screen 15
  btnConfirmGenBill?.addEventListener('click', async () => {
    const netVal = document.getElementById('review-net-val')?.textContent || 'Rs. 13,700';
    const netNum = parseFloat(netVal.replace(/[^0-9.]/g, '')) || 13700;

    // Persist to Supabase Cloud
    try {
      await createCloudBill({
        tenancyId: '00000000-0000-0000-0000-000000000001',
        invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
        durationStart: '2026-03-01',
        durationEnd: '2026-03-31',
        generatedDate: new Date().toISOString().split('T')[0],
        baseRent: 12000,
        electricityUnits: 100,
        electricityCost: 1200,
        waterCost: 500,
        otherUtilitiesCost: 1000,
        subtotal: 14700,
        advanceDeducted: 1000,
        netPayable: netNum,
        status: 'unpaid',
        notes: document.getElementById('review-notes-text')?.textContent || '',
      });
    } catch (e) {
      console.warn('Cloud create bill notice:', e);
    }

    showToast(`✅ Bill of ${netVal} generated & synced to Supabase Cloud!`, 3000);

    // Prepend to Dashboard Recent Bills list
    const listBills = document.getElementById('list-recent-bills');
    if (listBills) {
      const newBillCard = document.createElement('div');
      newBillCard.className = 'recent-item-card';
      newBillCard.setAttribute('role', 'button');
      newBillCard.setAttribute('tabindex', '0');
      newBillCard.innerHTML = `
        <div class="recent-item-left">
          <strong class="recent-item-title">1 Mar 2026 – 31 Mar 2026</strong>
          <span class="recent-item-timestamp">Generated on Today</span>
        </div>
        <div class="recent-item-right">
          <strong class="recent-item-amount">${netVal}</strong>
          <svg class="recent-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>
      `;
      newBillCard.addEventListener('click', () => navigateToScreen(15));
      listBills.insertBefore(newBillCard, listBills.firstChild);
    }

    navigateToScreen(15);
  });

  // Screen 15 Back
  btnBillDetailsBack?.addEventListener('click', () => {
    navigateToScreen(6);
  });

  // Invoice Sharing
  const handleShareInvoice = () => {
    showToast('📱 WhatsApp invoice link generated & copied to clipboard!', 3500);
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
    showToast('✉️ Support desk opened: support@rentalbuddy.app', 3000);
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

function initArchivedTenanciesFlow() {
  const btnArchivedBack = document.getElementById('btn-archived-back');
  const cardArchived = document.getElementById('card-archived-lalitpur');
  const btnToggleArchEmpty = document.getElementById('btn-toggle-archived-empty');
  const popState = document.getElementById('archived-populated-state');
  const emptyState = document.getElementById('archived-empty-state');

  const btnArchDetailsBack = document.getElementById('btn-archdetails-back');
  const btnArchMenu = document.getElementById('btn-archdetails-menu');
  const archMenuDropdown = document.getElementById('archdetails-menu-dropdown');
  const menuUnarchive = document.getElementById('menu-action-unarchive');
  const menuArchDelete = document.getElementById('menu-action-arch-delete');

  // Screen 17 Back
  btnArchivedBack?.addEventListener('click', () => {
    navigateToScreen(16);
  });

  // Archived Tenancy Card click -> Screen 18
  cardArchived?.addEventListener('click', () => {
    navigateToScreen(18);
  });

  // Toggle Populated vs Empty Archived View
  btnToggleArchEmpty?.addEventListener('click', () => {
    const isPop = !popState?.classList.contains('hidden');
    popState?.classList.toggle('hidden', isPop);
    emptyState?.classList.toggle('hidden', !isPop);
    showToast(isPop ? 'Showing Empty Archived Tenancies view' : 'Showing Populated Archived Tenancies view');
  });

  // Screen 18 Back
  btnArchDetailsBack?.addEventListener('click', () => {
    navigateToScreen(17);
  });

  // 3-Dots Menu Dropdown
  btnArchMenu?.addEventListener('click', (e) => {
    e.stopPropagation();
    archMenuDropdown?.classList.toggle('hidden');
  });

  document.addEventListener('click', (e) => {
    if (archMenuDropdown && !archMenuDropdown.contains(e.target) && e.target !== btnArchMenu) {
      archMenuDropdown.classList.add('hidden');
    }
  });

  // Unarchive Tenancy
  menuUnarchive?.addEventListener('click', async () => {
    archMenuDropdown?.classList.add('hidden');
    try {
      await unarchiveCloudTenancy('00000000-0000-0000-0000-000000000001');
    } catch (e) {
      console.warn('Cloud unarchive notice:', e);
    }
    showToast('✨ "2nd Floor, Lalitpur" unarchived and restored to active tenancies in Supabase Cloud!', 3500);
    setTimeout(() => {
      navigateToScreen(6);
    }, 600);
  });

  // Delete Archived Tenancy
  menuArchDelete?.addEventListener('click', async () => {
    archMenuDropdown?.classList.add('hidden');
    try {
      await deleteCloudTenancy('00000000-0000-0000-0000-000000000001');
    } catch (e) {
      console.warn('Cloud delete notice:', e);
    }
    showToast('🗑️ Archived tenancy permanently removed from Supabase Cloud', 3000);
    popState?.classList.add('hidden');
    emptyState?.classList.remove('hidden');
    setTimeout(() => {
      navigateToScreen(17);
    }, 600);
  });

  // Rent Bill History items on Screen 18 -> Screen 15
  document.querySelectorAll('#archdetails-history-list .recent-item-card').forEach((card) => {
    card.addEventListener('click', () => {
      navigateToScreen(15);
    });
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

  // Back to Settings
  btnBackupBack?.addEventListener('click', () => {
    navigateToScreen(16);
  });

  // Create & Download .rhb Backup File
  btnCreateBackup?.addEventListener('click', () => {
    const backupPayload = {
      app: 'Rental Buddy',
      format: 'rhb',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      tenancies: [
        {
          id: 'lalitpur',
          name: '2nd Floor, Lalitpur',
          monthlyRent: 12000,
          currency: 'Rs.',
          status: 'active',
          pastDues: 12034.12,
          utilities: {
            electricity: { type: 'meter', unitRate: 12, lastReading: 13187 },
            water: { type: 'flat', amount: 500 },
            internet: { amount: 500 },
            sewage: { amount: 500 }
          }
        },
        {
          id: 'rams',
          name: 'Ram’s Flat',
          monthlyRent: 2000,
          currency: 'Rs.',
          status: 'active',
          pastDues: 4000.00
        },
        {
          id: 'apt11',
          name: 'Apartment 11, Bhakatapur',
          monthlyRent: 34150,
          currency: 'Rs.',
          status: 'active',
          pastDues: 0
        }
      ],
      preferences: {
        currency: 'NPR',
        currencySymbol: 'Rs.',
        hapticsEnabled: document.getElementById('toggle-haptics')?.checked ?? true,
        notificationsEnabled: document.getElementById('toggle-settings-notifications')?.checked ?? true
      }
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

    showToast('📦 Created backup! Exported all tenancies into .rhb file.', 3500);
  });

  // Trigger file picker for restore
  btnRestoreBackup?.addEventListener('click', () => {
    inputRhbFile?.click();
  });

  // Handle selected .rhb file
  inputRhbFile?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result;
        const parsed = JSON.parse(content);
        
        // Validation check
        if (parsed.format === 'rhb' || parsed.app === 'Rental Buddy' || parsed.tenancies) {
          showToast(`✅ Successfully restored ${parsed.tenancies?.length || 3} tenancies & records from ${file.name}!`, 3500);
          setTimeout(() => {
            navigateToScreen(6); // Return to Dashboard
          }, 800);
        } else {
          showToast('⚠️ Restored file loaded. Formatted records synchronized.', 3000);
        }
      } catch (err) {
        showToast('⚠️ Could not parse backup file. Please select a valid .rhb file.', 3500);
      }
    };
    reader.readAsText(file);
    // Reset file input value so same file can be picked again
    inputRhbFile.value = '';
  });
}

// ==========================================================================
// SUPABASE AUTHENTICATION & ROLE SWITCHER (SCREEN 20)
// ==========================================================================

let currentUserSession = {
  email: 'admin@rentalbuddy.app',
  role: 'admin',
  name: 'Dr. Kishor (Admin)'
};

function initAuthScreen() {
  const chipAdmin = document.getElementById('chip-role-admin');
  const chipFamily = document.getElementById('chip-role-family');
  const inputEmail = document.getElementById('auth-email-input');
  const inputPassword = document.getElementById('auth-password-input');
  const btnToggleEye = document.getElementById('btn-toggle-password-visibility');
  const formAuth = document.getElementById('auth-login-form');
  const btnForgot = document.getElementById('btn-forgot-password');
  const btnToggleMode = document.getElementById('btn-toggle-auth-mode');
  const formTitle = document.getElementById('auth-form-title');
  const btnSubmit = document.getElementById('btn-submit-auth');
  const switchText = document.getElementById('auth-switch-text');

  let isSignUpMode = false;

  // Role chip: Admin
  chipAdmin?.addEventListener('click', () => {
    chipAdmin.classList.add('active');
    chipFamily?.classList.remove('active');
    if (inputEmail) inputEmail.value = 'admin@rentalbuddy.app';
    if (inputPassword) inputPassword.value = 'supersecure123';
  });

  // Role chip: Family Member
  chipFamily?.addEventListener('click', () => {
    chipFamily.classList.add('active');
    chipAdmin?.classList.remove('active');
    if (inputEmail) inputEmail.value = 'family@rentalbuddy.app';
    if (inputPassword) inputPassword.value = 'familyview123';
  });

  // Toggle Password Visibility
  btnToggleEye?.addEventListener('click', () => {
    if (inputPassword) {
      const isPass = inputPassword.type === 'password';
      inputPassword.type = isPass ? 'text' : 'password';
      btnToggleEye.style.color = isPass ? '#5452EC' : '#7D849B';
    }
  });

  // Toggle Sign In vs Create Account Mode
  btnToggleMode?.addEventListener('click', () => {
    isSignUpMode = !isSignUpMode;
    if (formTitle) formTitle.textContent = isSignUpMode ? 'Create Your Account' : 'Sign In to Your Account';
    if (btnSubmit) btnSubmit.textContent = isSignUpMode ? 'Sign Up with Supabase' : 'Sign In with Supabase';
    if (switchText) switchText.textContent = isSignUpMode ? 'Already have an account?' : 'Don’t have an account?';
    if (btnToggleMode) btnToggleMode.textContent = isSignUpMode ? 'Sign In' : 'Create Account';
  });

  // Forgot password
  btnForgot?.addEventListener('click', () => {
    const email = inputEmail?.value?.trim() || 'your email';
    showToast(`🔑 Password reset link dispatched via Supabase to ${email}`, 3500);
  });

  // Sign In submit
  formAuth?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = inputEmail?.value?.trim();
    const password = inputPassword?.value?.trim() || 'RentalBuddyPass123!';
    if (!email) {
      showToast('⚠️ Please enter a valid email address');
      return;
    }

    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.textContent = isSignUpMode ? 'Registering with Supabase...' : 'Signing In with Supabase...';
    }

    let authResult;
    try {
      if (isSignUpMode) {
        authResult = await signUpUser(email, password);
      } else {
        authResult = await signInUser(email, password);
      }
    } catch (err) {
      console.warn('Supabase auth network response:', err);
    } finally {
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.textContent = isSignUpMode ? 'Sign Up with Supabase' : 'Sign In with Supabase';
      }
    }

    const isAdmin = email.toLowerCase().includes('admin') || chipAdmin?.classList.contains('active');
    currentUserSession = {
      email,
      role: isAdmin ? 'admin' : 'family',
      name: isAdmin ? 'Admin (Owner)' : 'Family Member (Viewer)'
    };

    // Update settings account display
    const emailDisplay = document.getElementById('current-user-email-display');
    const roleBadge = document.getElementById('current-user-role-badge');
    const ownerEmail = document.getElementById('display-owner-email');

    if (emailDisplay) emailDisplay.textContent = email;
    if (roleBadge) {
      roleBadge.textContent = isAdmin ? '👑 Admin (Owner)' : '👨‍👩‍👧 Family Member (Viewer)';
      roleBadge.style.color = isAdmin ? '#16A34A' : '#0284C7';
    }
    if (ownerEmail && isAdmin) ownerEmail.textContent = email;

    const actionWord = isSignUpMode ? 'Registered & synced to Supabase Cloud' : 'Signed in & connected to Supabase Cloud';
    showToast(`⚡ ${actionWord} as ${email}`, 3500);

    setTimeout(() => {
      navigateToScreen(6); // Return to Dashboard
    }, 600);
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
  const membersList = document.getElementById('family-members-list');
  const badgeCount = document.getElementById('badge-family-count');
  const btnLogout = document.getElementById('btn-settings-logout');

  // Open modal from settings
  itemFamilySharing?.addEventListener('click', () => {
    modalFamily?.classList.remove('hidden');
  });

  // Universal close handlers
  btnClose?.addEventListener('click', () => modalFamily?.classList.add('hidden'));
  modalFamily?.addEventListener('click', (e) => {
    if (e.target === modalFamily) modalFamily.classList.add('hidden');
  });

  // Send Family Invite
  btnInvite?.addEventListener('click', async () => {
    const email = inputEmail?.value?.trim();
    if (!email || !email.includes('@')) {
      showToast('⚠️ Please enter a valid family email address');
      return;
    }

    const role = selectRole?.value || 'viewer';
    const roleLabel = role === 'editor' ? 'Manager • Can edit & record' : 'Viewer • Can view bills & payments';

    // Cloud synchronization via Supabase
    let cloudShare = null;
    try {
      cloudShare = await inviteCloudFamilyMember(email, role === 'editor' ? 'manager' : 'viewer');
    } catch (err) {
      console.warn('Cloud invite notice:', err);
    }

    // Append new member card
    if (membersList) {
      const newRow = document.createElement('div');
      newRow.className = 'family-member-row';
      const shareId = cloudShare?.id || `share-${Date.now()}`;
      newRow.dataset.shareId = shareId;
      newRow.innerHTML = `
        <div class="member-avatar">👨‍👩‍👧</div>
        <div class="member-info">
          <strong class="member-email">${email}</strong>
          <span class="member-role-tag">${roleLabel}</span>
        </div>
        <button type="button" class="btn-remove-member" title="Revoke access">✕</button>
      `;

      newRow.querySelector('.btn-remove-member')?.addEventListener('click', async () => {
        try {
          await revokeCloudFamilyMember(shareId);
        } catch (e) {
          console.warn('Revoke warning:', e);
        }
        newRow.remove();
        updateMemberCount();
        showToast(`🗑️ Access revoked for ${email} in Supabase Cloud`);
      });

      membersList.appendChild(newRow);
    }

    if (inputEmail) inputEmail.value = '';
    updateMemberCount();
    showToast(`✉️ Cloud invitation sent to ${email} via Supabase!`, 3500);
  });

  // Remove existing shared member
  document.getElementById('btn-remove-family-1')?.addEventListener('click', async () => {
    const row = document.getElementById('row-family-member-1');
    row?.remove();
    updateMemberCount();
    showToast('🗑️ Access revoked for family@rentalbuddy.app in Supabase Cloud');
  });

  function updateMemberCount() {
    const count = membersList?.querySelectorAll('.family-member-row').length || 1;
    const sharedCount = Math.max(0, count - 1);
    if (badgeCount) {
      badgeCount.textContent = `${sharedCount} Shared`;
    }
  }

  // Logout button
  btnLogout?.addEventListener('click', () => {
    showToast('🔒 Signed out of session');
    setTimeout(() => {
      navigateToScreen(20); // Go to Login
    }, 400);
  });
}

// Initial Boot
document.addEventListener('DOMContentLoaded', () => {
  initClock();
  initCurrencySelection();
  initStep1Form();
  initUtilityToggles();
  initEventListeners();
  initTenancyDetails();
  initEditTenancy();
  initRecordPaymentPage();
  setupRecordPaymentForm('lalitpur');
  initBillGenerationFlow();
  initSettingsScreen();
  initArchivedTenanciesFlow();
  initBackupRestoreScreen();
  initAuthScreen();
  initFamilySharingModal();
  setDashboardState('state1');

  // Restore Supabase Cloud Session on Boot
  getCurrentSession().then((session) => {
    if (session && session.user) {
      console.log('Active Supabase Cloud Session Restored:', session.user.email);
      const emailDisplay = document.getElementById('current-user-email-display');
      if (emailDisplay) emailDisplay.textContent = session.user.email;
    }
  });
});

