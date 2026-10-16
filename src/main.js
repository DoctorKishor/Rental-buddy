// ==========================================================================
// RENTAL BUDDY — CONTROLLER & APP STATE
// ==========================================================================

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

  document.getElementById('btn-step3-confirm')?.addEventListener('click', () => {
    state.hasCreatedTenancy = true;
    showToast('🎉 Tenancy "2nd Floor, Lalitpur" created successfully!', 3500);
    setTimeout(() => {
      setDashboardState('state1');
      navigateToScreen(6);
    }, 1200);
  });

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
  settingsBtn?.addEventListener('click', () => showToast('⚙️ App Settings & Preferences'));

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

  // Wire up Record buttons
  document.getElementById('btn-lalitpur-action')?.addEventListener('click', () => {
    const actionText = document.getElementById('lalitpur-action-text')?.textContent;
    if (actionText?.includes('Generate Bill')) {
      openBillModal('2nd Floor, Lalitpur', 'Monthly - April 2026', '12,034.12');
    } else {
      openRecordModal('2nd Floor, Lalitpur', '12000');
    }
  });

  document.getElementById('btn-rams-action')?.addEventListener('click', () => {
    const actionText = document.getElementById('rams-action-text')?.textContent;
    if (actionText?.includes('Generate Bill')) {
      openBillModal('Ram’s Flat', 'Weekly - April 2026', '2,540.00');
    } else {
      openRecordModal('Ram’s Flat', '2000');
    }
  });

  document.getElementById('btn-apt-record')?.addEventListener('click', () => {
    openRecordModal('Apartment 11, Bhakatapur', '34150');
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
    if (lalitpurRightVal) lalitpurRightVal.textContent = '1 Baisakh 2083';
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
    if (ramsRightVal) ramsRightVal.textContent = '1 Baisakh 2083';
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
    if (lalitpurRightVal) lalitpurRightVal.textContent = '1 Baisakh 2083';
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

// Initial Boot
document.addEventListener('DOMContentLoaded', () => {
  initClock();
  initCurrencySelection();
  initStep1Form();
  initUtilityToggles();
  initEventListeners();
  setDashboardState('state1');
});
