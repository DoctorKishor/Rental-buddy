// ==========================================================================
// RENTAL BUDDY — CONTROLLER & APP STATE (SUPABASE CLOUD FIRST)

export function formatCurrencyAmount(val) {
  const n = parseFloat(val || 0);
  if (isNaN(n)) return '0';
  if (n % 1 === 0) {
    return n.toLocaleString('en-IN');
  }
  return n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

// ==========================================================================

import {
  supabase,
  cloudSession,
  ensureAuthenticated,
  signInUser,
  signUpUser,
  signOutUser,
  getCurrentSession,
  fetchCloudTenancies,
  createCloudTenancy,
  updateCloudTenancy,
  updateCloudTenancyUtilities,
  archiveCloudTenancy,
  unarchiveCloudTenancy,
  deleteCloudTenancy,
  scheduleCloudRentRevision,
  cancelCloudRentRevision,
  fetchCloudBills,
  createCloudBill,
  fetchCloudPayments,
  recordCloudPayment,
  fetchOutgoingFamilyShares,
  fetchIncomingFamilyShares,
  createSelectiveFamilyShare,
  respondToFamilyShare,
  revokeFamilyShare,
  leaveFamilyShare,
  updateFamilyShareRole,
  fetchCloudFamilyMembers,
  inviteCloudFamilyMember,
  revokeCloudFamilyMember,
  resendVerificationEmail,
  updateUserProfile,
  deleteUserAccountAndData,
} from './supabase.js';
import html2canvas from 'html2canvas';

const state = {
  currentScreen: 1,
  previousScreen: 1,
  currency: 'INR',
  currencyLabel: 'Indian Rupee (₹)',
  currencySymbol: '₹',
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
  if (!statusTime) return;
  const updateTime = () => {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    hours = hours % 12 || 12;
    statusTime.textContent = `${hours}:${minutes}`;
  };
  updateTime();
  setInterval(updateTime, 30000);
}

// Toast helper
// Helper: Detect if a tenancy includes utilities or is rent-only (zero utilities)
export function tenancyHasUtilities(t) {
  if (!t) return false;
  const utils = t.tenancy_utilities;
  if (!Array.isArray(utils) || utils.length === 0) return false;
  return utils.some((u) => u && (u.is_enabled === true || (u.is_enabled !== false && (parseFloat(u.price_per_unit || 0) > 0 || parseFloat(u.flat_amount || 0) > 0))));
}

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
  // Screen 13 Guard: If target is 13 (Generate Bill) but active tenancy is rent-only or user is a Viewer
  if (targetScreenNumber === 13) {
    if (currentActiveTenancy && getTenancyUserRole(currentActiveTenancy) === 'viewer') {
      showToast('👁️ Viewers have read-only access and cannot generate bills.', 3500);
      return;
    }
    if (currentActiveTenancy && !tenancyHasUtilities(currentActiveTenancy)) {
      showToast(`ℹ️ "${currentActiveTenancy.property_name}" is a rent-only tenancy. Use "Record Payment" to record rent.`, 3000);
      openRecordPaymentPage(currentActiveTenancy);
      return;
    }
  }

  // Screen 12 Guard: If target is 12 (Record Payment) but user is a Viewer
  if (targetScreenNumber === 12 && currentActiveTenancy && getTenancyUserRole(currentActiveTenancy) === 'viewer') {
    showToast('👁️ Viewers have read-only access and cannot record payments.', 3500);
    return;
  }

  // STRICT PRODUCTION AUTH GUARD:
  // Disallow screens 6 through 22 if the user is not authenticated!
  if (targetScreenNumber >= 6 && targetScreenNumber <= 22 && !cloudSession.user) {
    showToast('🔒 Please sign in or create an account to access Rental Buddy', 3000);
    targetScreenNumber = 20;
  }

  state.previousScreen = state.currentScreen;
  state.currentScreen = targetScreenNumber;

  // Auto-close any open modals and floating dropdown menus when transitioning screens
  document.querySelectorAll('.modal-overlay').forEach((modal) => {
    modal.classList.add('hidden');
  });
  document.querySelectorAll('.floating-action-menu').forEach((menu) => {
    menu.classList.add('hidden');
  });

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
  } else if (targetScreenNumber === 17) {
    loadArchivedTenancies();
  } else if (targetScreenNumber === 22) {
    refreshFamilySharingPage();
  }

  // Automatically enforce 10-digit phone and numeric keypad across active inputs
  initNumericAndPhoneInputs();
}

// Automatically ensure all numerical inputs across the app open the number keypad
// and strictly restrict phone number fields to 10 digits only
export function initNumericAndPhoneInputs() {
  // 1. Phone number inputs: strictly 10 digits only
  const phoneInputIds = ['input-phone-number', 'edit-tenant-phone'];
  phoneInputIds.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.setAttribute('type', 'tel');
      el.setAttribute('inputmode', 'tel');
      el.setAttribute('pattern', '[0-9]*');
      el.setAttribute('maxlength', '10');

      if (!el.dataset.phoneBound) {
        el.dataset.phoneBound = 'true';
        el.addEventListener('input', (e) => {
          const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
          if (e.target.value !== cleaned) {
            e.target.value = cleaned;
          }
        });
        el.addEventListener('paste', (e) => {
          setTimeout(() => {
            el.value = el.value.replace(/\D/g, '').slice(0, 10);
          }, 0);
        });
      }
    }
  });

  // 2. Numerical inputs: ensure number keypad (numeric or decimal) opens automatically
  const numInputs = document.querySelectorAll('input[type="number"], input[data-type="numeric"]');
  numInputs.forEach((input) => {
    const step = input.getAttribute('step');
    const isDecimal = step && step !== '1' && (step === 'any' || step.includes('.'));
    if (!input.hasAttribute('inputmode')) {
      input.setAttribute('inputmode', isDecimal ? 'decimal' : 'numeric');
    }
    if (!input.hasAttribute('min') && !input.id.includes('discount')) {
      input.setAttribute('min', '0');
    }
  });
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
        state.currencySymbol = '₹';
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

// Ordinal suffix helper (1st, 2nd, 3rd, 4th...)
export function getOrdinalSuffix(n) {
  const num = parseInt(n, 10);
  if (isNaN(num)) return 'th';
  const s = ['th', 'st', 'nd', 'rd'];
  const v = num % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

export function getOrdinal(n) {
  const num = parseInt(n, 10) || 1;
  return `${num}${getOrdinalSuffix(num)}`;
}

// Tenancy Step 1 Form Listeners
function initStep1Form() {
  const monthlyRadio = document.getElementById('cycle-monthly');
  const yearlyRadio = document.getElementById('cycle-yearly');
  const monthlyCard = document.querySelector('label[for="cycle-monthly"]');
  const yearlyCard = document.querySelector('label[for="cycle-yearly"]');
  const nativeDateInput = document.getElementById('native-billing-date');
  const textDateInput = document.getElementById('input-billing-date');
  const labelBillingDate = document.getElementById('label-billing-date');

  function updateStep1BillingDate() {
    const isYearly = yearlyRadio?.checked || state.tenancy.billingCycle === 'Yearly';
    if (labelBillingDate) {
      labelBillingDate.textContent = isYearly
        ? 'Recurring Billing Date (day & month of every year)'
        : 'Recurring Billing Date (date of the month)';
    }
    const val = nativeDateInput?.value;
    if (!val) {
      if (textDateInput) textDateInput.placeholder = isYearly ? 'Pick billing date of every year' : 'Pick recurring billing date';
      return;
    }
    const d = new Date(val + 'T00:00:00');
    if (isNaN(d.getTime())) return;
    const day = d.getDate();
    const ordinal = getOrdinal(day);
    const monthName = d.toLocaleDateString('en-US', { month: 'long' });
    const formatted = isYearly ? `${ordinal} ${monthName} of every year` : `${ordinal} of every month`;
    if (textDateInput) textDateInput.value = formatted;
    state.tenancy.billingDate = formatted;

    const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
    const monthShort = d.toLocaleDateString('en-US', { month: 'short' });
    const year = d.getFullYear();
    state.tenancy.nextBillingDateFormatted = `${weekday} ${day} ${monthShort}, ${year}`;
  }

  monthlyCard?.addEventListener('click', () => {
    monthlyCard.classList.add('selected');
    yearlyCard?.classList.remove('selected');
    monthlyRadio.checked = true;
    state.tenancy.billingCycle = 'Monthly';
    updateStep1BillingDate();
  });

  yearlyCard?.addEventListener('click', () => {
    yearlyCard.classList.add('selected');
    monthlyCard?.classList.remove('selected');
    yearlyRadio.checked = true;
    state.tenancy.billingCycle = 'Yearly';
    updateStep1BillingDate();
  });

  document.getElementById('btn-pick-contact')?.addEventListener('click', () => {
    showToast('📇 Contact picker: "John Doe (9812345678)" selected');
    const phoneInput = document.getElementById('input-phone-number');
    if (phoneInput) {
      phoneInput.value = '9812345678';
      phoneInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });

  // Interactive Date Picker Logic
  const datePickerTrigger = document.getElementById('datePickerTrigger');

  function updateFromDate(dateStr) {
    updateStep1BillingDate();
  }

  nativeDateInput?.addEventListener('change', (e) => {
    updateFromDate(e.target.value);
  });

  const openDatePicker = () => {
    if (nativeDateInput && typeof nativeDateInput.showPicker === 'function') {
      try {
        nativeDateInput.showPicker();
      } catch (err) {
        nativeDateInput.focus();
      }
    } else {
      nativeDateInput?.focus();
    }
  };
  datePickerTrigger?.addEventListener('click', openDatePicker);
  textDateInput?.addEventListener('click', openDatePicker);

  // Default initial date calculation (Current billing cycle)
  const todayIso = new Date().toISOString().split('T')[0];
  if (nativeDateInput && !nativeDateInput.value) {
    nativeDateInput.value = todayIso;
  }
  updateFromDate(todayIso);

  // Tenancy Start Date Picker Logic
  const startTrigger = document.getElementById('tenancyStartDateTrigger');
  const nativeStartInput = document.getElementById('native-tenancy-start-date');
  const textStartInput = document.getElementById('input-tenancy-start-date');

  function updateStartDateDisplay(dateStr) {
    if (!dateStr) return;
    const d = new Date(dateStr + 'T00:00:00');
    if (textStartInput) {
      textStartInput.value = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  }

  if (nativeStartInput && !nativeStartInput.value) {
    nativeStartInput.value = todayIso;
  }
  updateStartDateDisplay(todayIso);

  nativeStartInput?.addEventListener('change', (e) => {
    updateStartDateDisplay(e.target.value);
  });

  const openStartDatePicker = () => {
    if (nativeStartInput && typeof nativeStartInput.showPicker === 'function') {
      try {
        nativeStartInput.showPicker();
      } catch (err) {
        nativeStartInput.focus();
      }
    } else {
      nativeStartInput?.focus();
    }
  };
  startTrigger?.addEventListener('click', openStartDatePicker);
  textStartInput?.addEventListener('click', openStartDatePicker);
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
    const radio = labelElecFlat.querySelector('input[type="radio"]');
    if (radio) radio.checked = true;
    subfieldsElecFlat?.classList.remove('hidden');
    subfieldsElecMeter?.classList.add('hidden');
    state.tenancy.utilities.electricity.billType = 'Flat';
  });

  labelElecMeter?.addEventListener('click', () => {
    labelElecMeter.classList.add('selected');
    labelElecFlat?.classList.remove('selected');
    const radio = labelElecMeter.querySelector('input[type="radio"]');
    if (radio) radio.checked = true;
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
    const radio = labelWaterFlat.querySelector('input[type="radio"]');
    if (radio) radio.checked = true;
    subfieldsWaterFlat?.classList.remove('hidden');
    subfieldsWaterMeter?.classList.add('hidden');
    state.tenancy.utilities.water.billType = 'Flat';
  });

  labelWaterMeter?.addEventListener('click', () => {
    labelWaterMeter.classList.add('selected');
    labelWaterFlat?.classList.remove('selected');
    const radio = labelWaterMeter.querySelector('input[type="radio"]');
    if (radio) radio.checked = true;
    subfieldsWaterMeter?.classList.remove('hidden');
    subfieldsWaterFlat?.classList.add('hidden');
    state.tenancy.utilities.water.billType = 'Meter Reading';
  });
}

// Step 3 Confirmation screen binder
function syncConfirmationScreen() {
  const sym = state.currencySymbol || '₹';

  const nameVal = document.getElementById('input-tenancy-name')?.value?.trim() || '--';
  const rentVal = document.getElementById('input-rent-amount')?.value?.trim() || '0';
  const cycleInput = document.querySelector('input[name="billingCycle"]:checked');
  const cycleVal = cycleInput ? cycleInput.parentElement.querySelector('span:not(.custom-radio)')?.textContent?.trim() || 'Monthly' : 'Monthly';

  const nativeDate = document.getElementById('native-billing-date')?.value;
  let nextDateText = '--';
  if (nativeDate) {
    const d = new Date(nativeDate + 'T00:00:00');
    nextDateText = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  } else {
    nextDateText = '1st of next month';
  }

  const nameEl = document.getElementById('confirm-tenancy-name');
  if (nameEl) nameEl.textContent = nameVal;

  const rentEl = document.getElementById('confirm-rent-amount');
  if (rentEl) rentEl.textContent = `${sym}${parseFloat(rentVal.replace(/[^0-9.]/g, '') || 0).toLocaleString('en-IN')}`;

  const cycleEl = document.getElementById('confirm-billing-cycle');
  if (cycleEl) cycleEl.textContent = cycleVal;

  const nextDateEl = document.getElementById('confirm-next-date');
  if (nextDateEl) nextDateEl.textContent = nextDateText;

  const nativeStartDate = document.getElementById('native-tenancy-start-date')?.value;
  let startDateText = '--';
  if (nativeStartDate) {
    const d = new Date(nativeStartDate + 'T00:00:00');
    startDateText = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  const confirmStartDateEl = document.getElementById('confirm-start-date');
  if (confirmStartDateEl) confirmStartDateEl.textContent = startDateText;

  // Electricity
  const elecEnabled = document.getElementById('toggle-electricity')?.checked;
  const elecBlock = document.getElementById('confirm-block-electricity');
  const elecDivider = document.getElementById('divider-elec-water');
  if (elecBlock) elecBlock.style.display = elecEnabled ? 'block' : 'none';
  if (elecDivider) elecDivider.style.display = elecEnabled ? 'block' : 'none';

  if (elecEnabled) {
    const elecBillType = document.querySelector('input[name="billType-electricity"]:checked')?.value || 'Meter Reading';
    const billTypeEl = document.getElementById('confirm-elec-billtype');
    if (billTypeEl) billTypeEl.textContent = elecBillType;

    const meterRows = document.getElementById('confirm-elec-meter-rows');
    const flatRow = document.getElementById('confirm-elec-flat-row');

    if (elecBillType === 'Meter Reading') {
      meterRows?.classList.remove('hidden');
      flatRow?.classList.add('hidden');
      const elecPrice = document.getElementById('input-elec-price')?.value || '0';
      const elecReading = document.getElementById('input-elec-reading')?.value || '0';
      const priceEl = document.getElementById('confirm-elec-price');
      if (priceEl) priceEl.textContent = `${sym}${elecPrice}`;
      const readingEl = document.getElementById('confirm-elec-reading');
      if (readingEl) readingEl.textContent = elecReading;
    } else {
      meterRows?.classList.add('hidden');
      flatRow?.classList.remove('hidden');
      const flatAmount = document.getElementById('input-elec-flat-amount')?.value || '0';
      const flatEl = document.getElementById('confirm-elec-flat-amount');
      if (flatEl) flatEl.textContent = `${sym}${flatAmount}`;
    }
  }

  // Water
  const waterEnabled = document.getElementById('toggle-water')?.checked;
  const waterBlock = document.getElementById('confirm-block-water');
  const waterDivider = document.getElementById('divider-water-garbage');
  if (waterBlock) waterBlock.style.display = waterEnabled ? 'block' : 'none';
  if (waterDivider) waterDivider.style.display = waterEnabled ? 'block' : 'none';

  if (waterEnabled) {
    const waterBillType = document.querySelector('input[name="billType-water"]:checked')?.value || 'Flat';
    const waterTypeEl = document.getElementById('confirm-water-billtype');
    if (waterTypeEl) waterTypeEl.textContent = waterBillType;

    const flatRow = document.getElementById('confirm-water-flat-row');
    const meterRows = document.getElementById('confirm-water-meter-rows');

    if (waterBillType === 'Flat') {
      flatRow?.classList.remove('hidden');
      meterRows?.classList.add('hidden');
      const waterAmount = document.getElementById('input-water-amount')?.value || '0';
      const waterEl = document.getElementById('confirm-water-amount');
      if (waterEl) waterEl.textContent = `${sym}${waterAmount}`;
    } else {
      flatRow?.classList.add('hidden');
      meterRows?.classList.remove('hidden');
      const waterPrice = document.getElementById('input-water-price')?.value || '0';
      const waterReading = document.getElementById('input-water-reading')?.value || '0';
      const priceEl = document.getElementById('confirm-water-price');
      if (priceEl) priceEl.textContent = `${sym}${waterPrice}`;
      const readingEl = document.getElementById('confirm-water-reading');
      if (readingEl) readingEl.textContent = waterReading;
    }
  }

  // Garbage
  const garbageEnabled = document.getElementById('toggle-garbage')?.checked;
  const garbageBlock = document.getElementById('confirm-block-garbage');
  const garbageDivider = document.getElementById('divider-garbage-internet');
  if (garbageBlock) garbageBlock.style.display = garbageEnabled ? 'block' : 'none';

  if (garbageEnabled) {
    const garbageAmount = document.getElementById('input-garbage-amount')?.value || '0';
    const garbageEl = document.getElementById('confirm-garbage-amount');
    if (garbageEl) garbageEl.textContent = `${sym}${garbageAmount}`;
  }

  // Internet
  const internetEnabled = document.getElementById('toggle-internet')?.checked;
  const internetBlock = document.getElementById('confirm-block-internet');
  if (internetBlock) internetBlock.style.display = internetEnabled ? 'block' : 'none';
  if (garbageDivider) garbageDivider.style.display = internetEnabled && (garbageEnabled || waterEnabled || elecEnabled) ? 'block' : 'none';

  if (internetEnabled) {
    const internetAmount = document.getElementById('input-internet-amount')?.value || '0';
    const internetEl = document.getElementById('confirm-internet-amount');
    if (internetEl) internetEl.textContent = `${sym}${internetAmount}`;
  }

  const anyUtility = elecEnabled || waterEnabled || garbageEnabled || internetEnabled;
  let noUtilNotice = document.getElementById('confirm-no-utilities-notice');
  if (!anyUtility) {
    if (!noUtilNotice) {
      noUtilNotice = document.createElement('div');
      noUtilNotice.id = 'confirm-no-utilities-notice';
      noUtilNotice.style.cssText = 'padding: 14px 16px; color: #5452EC; background: #EFF0FA; border-radius: 14px; font-size: 14px; font-weight: 500; text-align: center; margin-top: 10px;';
      noUtilNotice.textContent = '✨ Rent-Only Tenancy • No utilities included (only rent needs to be paid)';
      const card = document.getElementById('confirm-utilities-card') || document.querySelector('#screen-9 .confirm-card:last-of-type');
      card?.appendChild(noUtilNotice);
    } else {
      noUtilNotice.style.display = 'block';
    }
  } else if (noUtilNotice) {
    noUtilNotice.style.display = 'none';
  }
}

// Helper: Reset create tenancy form inputs
export function resetCreateTenancyForm() {
  const nameInput = document.getElementById('input-tenancy-name');
  if (nameInput) nameInput.value = '';
  const rentInput = document.getElementById('input-rent-amount');
  if (rentInput) rentInput.value = '';
  const advInput = document.getElementById('input-advance-amount');
  if (advInput) advInput.value = '';
  const phoneInput = document.getElementById('input-phone-number');
  if (phoneInput) phoneInput.value = '';
  const elecReading = document.getElementById('input-elec-reading');
  if (elecReading) elecReading.value = '';
  const elecPrice = document.getElementById('input-elec-price');
  if (elecPrice) elecPrice.value = '';
  const elecFlat = document.getElementById('input-elec-flat-amount');
  if (elecFlat) elecFlat.value = '';
  const waterReading = document.getElementById('input-water-reading');
  if (waterReading) waterReading.value = '';
  const waterPrice = document.getElementById('input-water-price');
  if (waterPrice) waterPrice.value = '';
  const waterFlat = document.getElementById('input-water-amount');
  if (waterFlat) waterFlat.value = '';
  const garbageAmt = document.getElementById('input-garbage-amount');
  if (garbageAmt) garbageAmt.value = '';
  const internetAmt = document.getElementById('input-internet-amount');
  if (internetAmt) internetAmt.value = '';
  const notesInput = document.getElementById('input-additional-notes');
  if (notesInput) notesInput.value = '';

  const nativeStartDate = document.getElementById('native-tenancy-start-date');
  const inputStartDate = document.getElementById('input-tenancy-start-date');
  const today = new Date();
  const todayIso = today.toISOString().split('T')[0];
  if (nativeStartDate) nativeStartDate.value = todayIso;
  if (inputStartDate) inputStartDate.value = today.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Attach All Event Listeners
function initEventListeners() {
  // Universal Form Submit Protection: Prevent accidental full-page refreshes when pressing Enter
  document.querySelectorAll('form').forEach((f) => {
    f.addEventListener('submit', (e) => {
      e.preventDefault();
    });
  });

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
    resetCreateTenancyForm();
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

  document.getElementById('btn-goto-dashboard')?.addEventListener('click', async () => {
    if (cloudSession.user) {
      try {
        await updateUserProfile({ onboarding_completed: true });
        localStorage.setItem(`rb_onboarding_completed_${cloudSession.user.id}`, 'true');
      } catch (err) {
        console.warn('Save onboarding error:', err);
      }
      showToast('🎉 Onboarding completed! Welcome to Rental Buddy.', 3000);
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
    const phoneInput = document.getElementById('input-phone-number');
    const rawPhone = phoneInput?.value?.trim() || '';
    const cleanPhone = rawPhone.replace(/\D/g, '').slice(0, 10);
    if (phoneInput && rawPhone !== cleanPhone) {
      phoneInput.value = cleanPhone;
    }
    if (!name || !rent) {
      showToast('Please fill in Tenancy Name and Rent Amount');
      return;
    }
    if (rawPhone && cleanPhone.length !== 10) {
      showToast('⚠️ Phone number must be exactly 10 digits');
      return;
    }
    navigateToScreen(8);
  });

  // Screen 8: Step 2 (Utilities)
  document.getElementById('btn-step2-back')?.addEventListener('click', () => {
    navigateToScreen(7);
  });

  document.getElementById('btn-step2-next')?.addEventListener('click', () => {
    syncConfirmationScreen();
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
    const rawPhoneVal = document.getElementById('input-phone-number')?.value?.trim() || '';
    const phoneVal = rawPhoneVal.replace(/\D/g, '').slice(0, 10);

    if (!nameVal || isNaN(rentVal) || rentVal <= 0) {
      showToast('⚠️ Please enter a valid Tenancy Name and Rent Amount');
      navigateToScreen(7);
      return;
    }

    if (rawPhoneVal && phoneVal.length !== 10) {
      showToast('⚠️ Phone number must be exactly 10 digits');
      navigateToScreen(7);
      return;
    }

    const nativeDate = document.getElementById('native-billing-date')?.value;
    const nativeStartDate = document.getElementById('native-tenancy-start-date')?.value;
    let billingDay = 1;
    if (nativeDate) {
      billingDay = parseInt(nativeDate.split('-')[2], 10) || 1;
    }

    // Build utilities array for cloud persistence
    const utilities = [];
    const elecEnabled = document.getElementById('toggle-electricity')?.checked;
    if (elecEnabled) {
      const elecType = document.querySelector('input[name="billType-electricity"]:checked')?.value || 'Meter Reading';
      utilities.push({
        utility_type: 'electricity',
        is_enabled: true,
        bill_type: elecType === 'Meter Reading' ? 'meter_reading' : 'flat',
        price_per_unit: parseFloat(document.getElementById('input-elec-price')?.value) || 0,
        flat_amount: parseFloat(document.getElementById('input-elec-flat-amount')?.value) || 0,
        last_meter_reading: parseFloat(document.getElementById('input-elec-reading')?.value) || 0,
      });
    }

    const waterEnabled = document.getElementById('toggle-water')?.checked;
    if (waterEnabled) {
      const waterType = document.querySelector('input[name="billType-water"]:checked')?.value || 'Flat';
      utilities.push({
        utility_type: 'water',
        is_enabled: true,
        bill_type: waterType === 'Meter Reading' ? 'meter_reading' : 'flat',
        price_per_unit: parseFloat(document.getElementById('input-water-price')?.value) || 0,
        flat_amount: parseFloat(document.getElementById('input-water-amount')?.value) || 0,
        last_meter_reading: parseFloat(document.getElementById('input-water-reading')?.value) || 0,
      });
    }

    const garbageEnabled = document.getElementById('toggle-garbage')?.checked;
    if (garbageEnabled) {
      utilities.push({
        utility_type: 'garbage',
        is_enabled: true,
        bill_type: 'flat',
        flat_amount: parseFloat(document.getElementById('input-garbage-amount')?.value) || 0,
      });
    }

    const internetEnabled = document.getElementById('toggle-internet')?.checked;
    if (internetEnabled) {
      utilities.push({
        utility_type: 'internet',
        is_enabled: true,
        bill_type: 'flat',
        flat_amount: parseFloat(document.getElementById('input-internet-amount')?.value) || 0,
      });
    }

    try {
      const created = await createCloudTenancy({
        propertyName: nameVal,
        tenantName: 'Tenant',
        tenantPhone: phoneVal,
        baseRent: rentVal,
        advanceAmount: advanceVal,
        billingDay: billingDay,
        startDate: nativeStartDate || new Date().toISOString().split('T')[0],
        utilities: utilities,
      });
      if (created) {
        created.tenancy_utilities = utilities;
      }
      currentActiveTenancy = created;
      resetCreateTenancyForm();
      if (cloudSession.user) {
        localStorage.setItem(`rb_onboarding_completed_${cloudSession.user.id}`, 'true');
        try {
          updateUserProfile({ onboarding_completed: true });
        } catch (err) {
          // ignore
        }
      }
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

export let currentRecentTab = 'payments';

export function renderRecentActivityView(activeTab = currentRecentTab) {
  currentRecentTab = activeTab;
  const tabPayments = document.getElementById('tab-recent-payments');
  const tabBills = document.getElementById('tab-recent-bills');
  const heading = document.getElementById('recent-section-heading');
  const listPayments = document.getElementById('list-recent-payments');
  const listBills = document.getElementById('list-recent-bills');
  const emptyPayments = document.getElementById('empty-recent-payments');
  const emptyBills = document.getElementById('empty-recent-bills');

  if (activeTab === 'payments') {
    tabPayments?.classList.add('active');
    tabPayments?.setAttribute('aria-selected', 'true');
    tabBills?.classList.remove('active');
    tabBills?.setAttribute('aria-selected', 'false');
    if (heading) heading.textContent = 'Recent Payments';

    // Strictly hide Bills list & Bills empty state
    emptyBills?.classList.add('hidden');
    listBills?.classList.add('hidden');

    // Show Payments list OR Payments empty state
    if (cloudPaymentsList && cloudPaymentsList.length > 0) {
      emptyPayments?.classList.add('hidden');
      listPayments?.classList.remove('hidden');
    } else {
      listPayments?.classList.add('hidden');
      emptyPayments?.classList.remove('hidden');
    }
  } else {
    tabBills?.classList.add('active');
    tabBills?.setAttribute('aria-selected', 'true');
    tabPayments?.classList.remove('active');
    tabPayments?.setAttribute('aria-selected', 'false');
    if (heading) heading.textContent = 'Recent Bills';

    // Strictly hide Payments list & Payments empty state
    emptyPayments?.classList.add('hidden');
    listPayments?.classList.add('hidden');

    // Show Bills list OR Bills empty state
    if (cloudBillsList && cloudBillsList.length > 0) {
      emptyBills?.classList.add('hidden');
      listBills?.classList.remove('hidden');
    } else {
      listBills?.classList.add('hidden');
      emptyBills?.classList.remove('hidden');
    }
  }
}

function initDashboard() {
  const emptyCreateBtn = document.getElementById('btn-empty-create');
  const addTenancyBtn = document.getElementById('btn-dashboard-add');
  const settingsBtn = document.getElementById('btn-dashboard-settings');

  emptyCreateBtn?.addEventListener('click', () => {
    resetCreateTenancyForm();
    navigateToScreen(7);
  });
  addTenancyBtn?.addEventListener('click', () => {
    resetCreateTenancyForm();
    navigateToScreen(7);
  });
  settingsBtn?.addEventListener('click', () => navigateToScreen(16));

  // Live Cloud Status Banner -> Screen 20
  document.getElementById('cloud-status-banner')?.addEventListener('click', () => {
    navigateToScreen(20);
  });

  // Segmented Ledger Switcher (Payments vs Bills)
  const tabPayments = document.getElementById('tab-recent-payments');
  const tabBills = document.getElementById('tab-recent-bills');

  tabPayments?.addEventListener('click', () => {
    renderRecentActivityView('payments');
  });

  tabBills?.addEventListener('click', () => {
    renderRecentActivityView('bills');
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
    const dateInput = document.getElementById('record-date');
    if (dateInput && !dateInput.value) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }
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
    const chosenDate = document.getElementById('record-date')?.value || new Date().toISOString().split('T')[0];

    if (!amount || parseFloat(amount) <= 0) {
      showToast('⚠️ Please enter a valid payment amount');
      return;
    }

    try {
      if (tenancyId) {
        let channel = 'cash';
        let mode = 'cash';
        const methodLower = selectedMethod.toLowerCase();
        if (methodLower.includes('gpay') || methodLower.includes('upi')) {
          channel = 'upi';
          mode = 'online';
        } else if (methodLower.includes('neft') || methodLower.includes('bank')) {
          channel = 'neft';
          mode = 'online';
        }

        const formattedMonth = new Date(chosenDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

        await recordCloudPayment({
          tenancyId: tenancyId,
          amount: parseFloat(amount),
          paymentMode: mode,
          channel: channel,
          settledMonths: [formattedMonth],
          paymentDate: chosenDate,
        });
      }
      modalRecord?.classList.add('hidden');
      await syncDashboardFromCloud();
      showToast(`✅ Payment of ₹${parseFloat(amount).toLocaleString('en-IN')} recorded & saved to Supabase!`, 3500);
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

  function openBillModal(tenancy = 'Property', cycle = 'Monthly', total = '12,000') {
    if (billTargetTenancy) billTargetTenancy.textContent = tenancy;
    if (billTargetCycle) billTargetCycle.textContent = cycle;
    if (billCalculatedTotal) billCalculatedTotal.textContent = `₹${total}`;
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
export let cloudIncomingSharesList = [];
export let cloudOutgoingSharesList = [];
export let currentActiveTenancy = null;

export function getTenancyUserRole(tenancy) {
  if (!cloudSession.user || !tenancy) return 'viewer';
  if (tenancy.owner_id === cloudSession.user.id) return 'owner';

  // Check matching approved incoming share
  const matchingShare = (cloudIncomingSharesList || []).find((s) => {
    const isApproved = s.status === 'approved' || s.status === 'accepted';
    if (!isApproved) return false;
    if (!s.tenancy_ids || !Array.isArray(s.tenancy_ids) || s.tenancy_ids.length === 0) return true;
    return s.tenancy_ids.includes(tenancy.id);
  });

  if (matchingShare) {
    return matchingShare.role === 'manager' ? 'manager' : 'viewer';
  }
  return 'viewer';
}

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

    // 0. Fetch live incoming & outgoing family shares
    try {
      cloudIncomingSharesList = await fetchIncomingFamilyShares();
    } catch (e) {
      console.warn('Fetch incoming shares warning:', e);
      cloudIncomingSharesList = [];
    }
    try {
      cloudOutgoingSharesList = await fetchOutgoingFamilyShares();
    } catch (e) {
      console.warn('Fetch outgoing shares warning:', e);
      cloudOutgoingSharesList = [];
    }

    // Update incoming shares alert banner on Dashboard
    const pendingIncoming = (cloudIncomingSharesList || []).filter((s) => s.status === 'pending');
    const incomingBanner = document.getElementById('incoming-shares-alert-banner');
    const incomingBannerMsg = document.getElementById('share-alert-msg');
    if (incomingBanner) {
      if (pendingIncoming.length > 0) {
        incomingBanner.classList.remove('hidden');
        if (incomingBannerMsg) {
          incomingBannerMsg.innerHTML = `<strong>${pendingIncoming.length} incoming tenancy share${pendingIncoming.length > 1 ? 's' : ''}</strong> waiting for your approval!`;
        }
      } else {
        incomingBanner.classList.add('hidden');
      }
    }

    // Update family count on Settings Screen (Screen 16)
    const badgeFamilyCount = document.getElementById('badge-family-count');
    if (badgeFamilyCount) {
      badgeFamilyCount.textContent = `${(cloudOutgoingSharesList || []).length} Sharing`;
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
          const hasUtils = tenancyHasUtilities(t);
          const billingDay = t.billing_day || 1;
          const rentFormatted = parseFloat(t.base_rent || 0).toLocaleString('en-IN');
          const userRole = getTenancyUserRole(t);
          const isViewer = userRole === 'viewer';
          const isManager = userRole === 'manager';
          const isOwner = userRole === 'owner';

          let headerPillHtml = '';
          if (isViewer) {
            headerPillHtml = `<span class="status-pill status-upcoming" style="background: #E8E7FB; color: #5452EC;">👁️ Shared • Viewer (Read Only)</span>`;
          } else if (isManager) {
            headerPillHtml = `<span class="status-pill status-upcoming" style="background: #FEF3C7; color: #B45309;">🛠️ Shared • Manager</span>`;
          } else {
            headerPillHtml = `<span class="status-pill status-upcoming" style="${hasUtils ? '' : 'background: #E8E7FB; color: #5452EC;'};">${hasUtils ? 'Active • Utilities Included' : 'Active • Rent Only'}</span>`;
          }

          let actionRowHtml = '';
          if (isViewer) {
            actionRowHtml = `
            <div class="tenancy-action-row">
              <button type="button" class="btn-card-action lavender-action btn-view-tenancy-card" style="width: 100%;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                <span>View Details (Read Only)</span>
              </button>
            </div>
            `;
          } else if (hasUtils) {
            actionRowHtml = `
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
          } else {
            actionRowHtml = `
            <div class="tenancy-action-row">
              <button type="button" class="btn-card-action lavender-action btn-record-pay-card" style="width: 100%;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="6" width="20" height="12" rx="2"></rect>
                  <circle cx="12" cy="12" r="2.5"></circle>
                </svg>
                <span>Record Payment</span>
              </button>
            </div>
            `;
          }

          card.innerHTML = `
            <div class="tenancy-card-header">
              ${headerPillHtml}
            </div>
            <div class="tenancy-card-main-row" role="button" tabindex="0" aria-label="View ${t.property_name} tenancy details">
              <div class="tenancy-info">
                <h2 class="tenancy-name">${t.property_name}</h2>
                <span class="tenancy-meta-sub">₹${rentFormatted} • Monthly</span>
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
                <span class="metric-title">₹${rentFormatted}</span>
                <span class="metric-label">Base Rent</span>
              </div>
              <div class="metric-col right-align">
                <span class="metric-title">${billingDay}th of month</span>
                <span class="metric-label">${hasUtils ? 'Billing Date' : 'Rent Due Date'}</span>
              </div>
            </div>
            <div class="tenancy-card-divider"></div>
            ${actionRowHtml}
          `;

          card.querySelector('.tenancy-card-main-row')?.addEventListener('click', () => {
            currentActiveTenancy = t;
            bindTenancyToDetails(t);
            navigateToScreen(10);
          });

          card.querySelector('.btn-view-tenancy-card')?.addEventListener('click', () => {
            currentActiveTenancy = t;
            bindTenancyToDetails(t);
            navigateToScreen(10);
          });

          card.querySelector('.btn-gen-bill-card')?.addEventListener('click', () => {
            if (isViewer) {
              showToast('👁️ Viewers have read-only access.');
              return;
            }
            currentActiveTenancy = t;
            setupGenerateBillScreen(t);
            navigateToScreen(13);
          });

          card.querySelector('.btn-record-pay-card')?.addEventListener('click', () => {
            if (isViewer) {
              showToast('👁️ Viewers have read-only access.');
              return;
            }
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
    if (listBills) {
      listBills.innerHTML = '';
      if (cloudBillsList.length > 0) {
        cloudBillsList.forEach((b) => {
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
              <strong class="recent-item-amount">₹${formatCurrencyAmount(b.net_payable)}</strong>
              <svg class="recent-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
          `;
          item.addEventListener('click', () => {
            const prop = cloudTenanciesList.find((ten) => ten.id === b.tenancy_id);
            renderBillDetails({
              ...b,
              propertyName: prop ? prop.property_name : (b.tenancies?.property_name || 'Property'),
            });
            navigateToScreen(15);
          });
          listBills.appendChild(item);
        });
      }
    }

    // 3. Fetch real payments from Supabase
    const cloudPayments = await fetchCloudPayments();
    cloudPaymentsList = cloudPayments || [];
    const listPayments = document.getElementById('list-recent-payments');
    if (listPayments) {
      listPayments.innerHTML = '';
      if (cloudPaymentsList.length > 0) {
        cloudPaymentsList.forEach((p) => {
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
              <strong class="recent-item-amount">₹${formatCurrencyAmount(p.amount)}</strong>
              <svg class="recent-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
          `;
          item.addEventListener('click', () => {
            const prop = cloudTenanciesList.find((ten) => ten.id === p.tenancy_id);
            openPaymentReceipt(p, prop);
          });
          listPayments.appendChild(item);
        });
      }
    }

    // Refresh mutually exclusive recent activity view
    renderRecentActivityView();

    // 4. Update Family sharing list
    const members = await fetchCloudFamilyMembers();
    const membersList = document.getElementById('family-members-list');
    const badgeCount = document.getElementById('badge-family-count');
    if (membersList) {
      membersList.querySelectorAll('.dynamic-cloud-member').forEach((m) => m.remove());
      if (members && members.length > 0) {
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
            try {
              await revokeCloudFamilyMember(m.id);
              row.remove();
              const remaining = membersList.querySelectorAll('.dynamic-cloud-member').length;
              if (badgeCount) badgeCount.textContent = `${remaining} Shared`;
              showToast(`🗑️ Revoked access for ${m.member_email}`);
            } catch (revErr) {
              showToast(`❌ Error revoking access: ${revErr.message}`);
            }
          });
          membersList.appendChild(row);
        });
        if (badgeCount) {
          badgeCount.textContent = `${members.length} Shared`;
        }
      } else {
        if (badgeCount) {
          badgeCount.textContent = `0 Shared`;
        }
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

export async function bindTenancyToDetails(t, targetYear = null) {
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
  const viewHistory = document.getElementById('view-bill-history');
  const historyList = viewHistory;
  const viewMonth = document.getElementById('view-month-status');
  const chipPaid = document.getElementById('chip-count-paid');
  const chipDue = document.getElementById('chip-count-due');
  const chipUpcoming = document.getElementById('chip-count-upcoming');

  if (propTitle) propTitle.textContent = t.property_name;
  const rentNum = parseFloat(t.base_rent || 0);
  if (rentRate) rentRate.textContent = `₹${rentNum.toLocaleString('en-IN')} • Monthly`;
  const bDay = parseInt(t.billing_day, 10) || 1;
  const now = new Date();
  let nextDate = new Date(now.getFullYear(), now.getMonth(), bDay);
  if (now.getDate() > bDay) {
    nextDate = new Date(now.getFullYear(), now.getMonth() + 1, bDay);
  }
  const nextMonthName = nextDate.toLocaleDateString('en-US', { month: 'long' });
  if (nextBilling) {
    nextBilling.textContent = `${getOrdinal(bDay)} ${nextMonthName}`;
  }

  // Bind to Edit Tenancy form (Screen 11) inputs too
  const editSubtitle = document.getElementById('edit-stepper-subtitle');
  const editName = document.getElementById('edit-tenancy-name');
  const editRent = document.getElementById('edit-rent-amount');
  const editPhone = document.getElementById('edit-tenant-phone');
  const editAdvance = document.getElementById('edit-advance-amount');
  const editDateDisplay = document.getElementById('edit-billing-date-display');
  const editNativeDate = document.getElementById('edit-native-billing-date');
  const reviseCurrentRent = document.getElementById('revise-current-rent-display');

  if (editSubtitle) editSubtitle.textContent = t.property_name || '--';
  if (editName) editName.value = t.property_name || '';
  if (editRent) editRent.value = t.base_rent || '';
  if (editPhone) editPhone.value = t.tenant_phone || '';
  if (editAdvance) editAdvance.value = t.advance_amount || '';

  const isYearlyCycle = (t.billing_cycle || '').toLowerCase() === 'yearly';
  const editLabelBillingDate = document.getElementById('label-edit-billing-date');
  if (editLabelBillingDate) {
    editLabelBillingDate.textContent = isYearlyCycle ? 'Recurring Billing Date (day & month of every year)' : 'Recurring Billing Date (date of the month)';
  }
  const cycleCardMonthly = document.getElementById('edit-cycle-monthly');
  const cycleCardYearly = document.getElementById('edit-cycle-yearly');
  const radioMonthly = document.querySelector('input[name="edit-billing-cycle"][value="Monthly"]');
  const radioYearly = document.querySelector('input[name="edit-billing-cycle"][value="Yearly"]');
  if (isYearlyCycle) {
    cycleCardYearly?.classList.add('selected');
    cycleCardMonthly?.classList.remove('selected');
    if (radioYearly) radioYearly.checked = true;
  } else {
    cycleCardMonthly?.classList.add('selected');
    cycleCardYearly?.classList.remove('selected');
    if (radioMonthly) radioMonthly.checked = true;
  }

  if (editDateDisplay) {
    editDateDisplay.value = isYearlyCycle ? `${getOrdinal(t.billing_day || 1)} of every year` : `${getOrdinal(t.billing_day || 1)} of every month`;
  }
  if (editNativeDate) {
    const dayStr = (t.billing_day || 1).toString().padStart(2, '0');
    editNativeDate.value = `2026-04-${dayStr}`;
  }
  const editStartDateDisplay = document.getElementById('edit-start-date-display');
  const editNativeStartDate = document.getElementById('edit-native-start-date');
  const tenancyStartDateVal = t.start_date || (t.created_at ? t.created_at.split('T')[0] : '');
  if (editNativeStartDate) editNativeStartDate.value = tenancyStartDateVal;
  if (editStartDateDisplay && tenancyStartDateVal) {
    const sd = new Date(tenancyStartDateVal + 'T00:00:00');
    editStartDateDisplay.value = sd.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  if (reviseCurrentRent) reviseCurrentRent.value = `₹${rentNum.toLocaleString('en-IN')}`;

  const elecUtil = t.tenancy_utilities?.find((u) => u.utility_type === 'electricity');
  const waterUtil = t.tenancy_utilities?.find((u) => u.utility_type === 'water');

  const editElecPrice = document.getElementById('edit-elec-price');
  if (editElecPrice) editElecPrice.value = elecUtil ? (elecUtil.price_per_unit || '') : '';
  const editToggleElec = document.getElementById('edit-toggle-elec');
  if (editToggleElec) editToggleElec.checked = elecUtil ? elecUtil.is_enabled !== false : false;
  document.getElementById('edit-util-electricity')?.classList.toggle('expanded', editToggleElec?.checked ?? false);
  document.getElementById('edit-details-elec')?.classList.toggle('hidden', !(editToggleElec?.checked ?? false));

  const editWaterAmount = document.getElementById('edit-water-amount');
  if (editWaterAmount) editWaterAmount.value = waterUtil ? (waterUtil.flat_amount || '') : '';
  const editToggleWater = document.getElementById('edit-toggle-water');
  if (editToggleWater) editToggleWater.checked = waterUtil ? waterUtil.is_enabled !== false : false;
  document.getElementById('edit-util-water')?.classList.toggle('expanded', editToggleWater?.checked ?? false);
  document.getElementById('edit-details-water')?.classList.toggle('hidden', !(editToggleWater?.checked ?? false));

  // Restore active scheduled revision banner if present
  const bannerRevision = document.getElementById('scheduled-revision-banner');
  const bannerRevisionText = document.getElementById('banner-revision-text');
  const activeRevision = t.rent_revisions?.find((r) => r.status === 'scheduled');
  if (activeRevision && bannerRevision && bannerRevisionText) {
    bannerRevisionText.textContent = `₹${parseFloat(activeRevision.new_rent).toLocaleString('en-IN')} scheduled (${activeRevision.note || 'Next Cycle'})`;
    bannerRevision.classList.remove('hidden');
  } else if (bannerRevision) {
    bannerRevision.classList.add('hidden');
  }

  // Fetch tenancy payments & bills dynamically from Supabase
  try {
    const [allBills, allPayments] = await Promise.all([fetchCloudBills(t.id), fetchCloudPayments(t.id)]);
    const tenancyBills = (allBills || []).filter(b => b.tenancy_id === t.id);
    const tenancyPayments = (allPayments || []).filter(p => p.tenancy_id === t.id);

    const hasUtils = tenancyHasUtilities(t);

    const sublabel = document.querySelector('.summary-card-sublabel');
    if (sublabel) sublabel.textContent = hasUtils ? 'Total Bill Paid' : 'Total Rent Paid';

    const nextBillLabel = document.querySelector('#details-next-bill-col .metric-label');
    if (nextBillLabel) nextBillLabel.textContent = hasUtils ? 'Next Billing' : 'Next Rent Due';

    const totalPaid = tenancyPayments.reduce((acc, p) => acc + parseFloat(p.amount || 0), 0);
    if (billsCount) billsCount.textContent = hasUtils ? `${tenancyPayments.length} paid` : `${tenancyPayments.length} payments`;
    if (totalAmount) totalAmount.textContent = `₹${formatCurrencyAmount(totalPaid)}`;

    if (hasUtils && tenancyBills.length > 0 && lastBillCol && lastBillAmount) {
      lastBillCol.classList.remove('hidden');
      lastBillAmount.textContent = `₹${parseFloat(tenancyBills[0].net_payable).toLocaleString('en-IN')}`;
    } else if (lastBillCol) {
      lastBillCol.classList.add('hidden');
    }

    // Enforce role-based controls on Screen 10
    const userRole = getTenancyUserRole(t);
    const isViewer = userRole === 'viewer';
    const menuBtn = document.getElementById('btn-details-menu');
    if (menuBtn) {
      menuBtn.style.display = isViewer ? 'none' : '';
    }

    // Update sticky bottom button on Screen 10
    const generateBillBtn = document.getElementById('btn-details-generate-bill');
    if (generateBillBtn) {
      if (isViewer) {
        generateBillBtn.style.display = 'none';
      } else {
        generateBillBtn.style.display = '';
        generateBillBtn.textContent = hasUtils ? 'Generate New Bill' : 'Record Payment';
      }
    }

    const emptyBillsHeading = document.querySelector('#details-empty-bills .empty-recent-heading');
    const emptyBillsCopy = document.querySelector('#details-empty-bills .empty-recent-copy');
    if (emptyBillsHeading) {
      emptyBillsHeading.textContent = hasUtils ? 'No bills or payments yet' : 'No payments recorded yet';
    }
    if (emptyBillsCopy) {
      emptyBillsCopy.textContent = hasUtils
        ? 'You will see them here once they are generated or recorded.'
        : 'You will see payments here once they are recorded.';
    }

    // 1. Populate Month-wise 12-Month Stack for targetYear
    const yearSelect = document.getElementById('details-year-select');
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIdx = now.getMonth(); // 0-indexed
    const activeYear = targetYear !== null ? parseInt(targetYear, 10) : (parseInt(yearSelect?.value, 10) || currentYear);
    if (yearSelect && targetYear !== null) {
      yearSelect.value = activeYear.toString();
    }
    const yearIndicator = document.getElementById('details-year-indicator');
    if (yearIndicator) {
      yearIndicator.textContent = `Year ${activeYear} (Jan–Dec)`;
    }

    const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    let paidCount = 0;
    let dueCount = 0;
    let upcomingCount = 0;

    if (monthStack) {
      monthStack.innerHTML = '';
      MONTHS.forEach((monthName, idx) => {
        // 1. Tenancy Start Boundary Check: strictly only show from start of tenancy
        const tenancyStart = t.start_date
          ? new Date(t.start_date + 'T00:00:00')
          : (t.created_at ? new Date(t.created_at) : new Date(activeYear, 0, 1));

        const isBeforeTenancyStart = (activeYear < tenancyStart.getFullYear()) ||
          (activeYear === tenancyStart.getFullYear() && idx < tenancyStart.getMonth());

        if (isBeforeTenancyStart) {
          // STRICT USER REQUIREMENT: Only show from the start of tenancy & not before that!
          return;
        }

        // 2. Check if this month has a matched payment
        let matchedPayment = null;
        let matchedMonthStr = '';
        let isAdvancePayment = false;
        let isPartialPayment = false;
        let monthAllocatedAmount = rentNum;

        for (const p of tenancyPayments) {
          if (Array.isArray(p.settled_months)) {
            const foundStr = p.settled_months.find((m) => {
              if (!m) return false;
              const lower = m.toLowerCase();
              const monthMatch = lower.includes(monthName.toLowerCase()) || monthName.toLowerCase().includes(lower);
              const yearMatch = lower.includes(activeYear.toString()) || (p.payment_date && new Date(p.payment_date).getFullYear() === activeYear);
              return monthMatch && yearMatch;
            });
            if (foundStr) {
              matchedPayment = p;
              matchedMonthStr = foundStr;
              isAdvancePayment = foundStr.toLowerCase().includes('advance');
              isPartialPayment = foundStr.toLowerCase().includes('partial');

              const matchAmt = foundStr.match(/(?:₹|Rs\.?)\s*([\d,]+(?:\.\d+)?)/i);
              if (matchAmt) {
                monthAllocatedAmount = parseFloat(matchAmt[1].replace(/,/g, '')) || rentNum;
              } else if (p.settled_months.length > 1) {
                if (isAdvancePayment) {
                  monthAllocatedAmount = Math.max(0, parseFloat(p.amount) - rentNum) || rentNum;
                } else {
                  monthAllocatedAmount = Math.min(rentNum, parseFloat(p.amount));
                }
              } else {
                monthAllocatedAmount = parseFloat(p.amount) || rentNum;
              }
              break;
            }
          } else if (p.payment_date) {
            const pDate = new Date(p.payment_date);
            if (pDate.getFullYear() === activeYear && pDate.getMonth() === idx) {
              matchedPayment = p;
              monthAllocatedAmount = parseFloat(p.amount) || rentNum;
              break;
            }
          }
        }

        // 3. Check if unpaid bill exists for activeYear
        const matchedBill = tenancyBills.find((b) => {
          if (b.status !== 'unpaid') return false;
          const sDate = b.duration_start ? new Date(b.duration_start) : null;
          const eDate = b.duration_end ? new Date(b.duration_end) : null;
          return (sDate && sDate.getFullYear() === activeYear && sDate.getMonth() === idx) ||
                 (eDate && eDate.getFullYear() === activeYear && eDate.getMonth() === idx);
        });

        const card = document.createElement('div');
        if (matchedPayment) {
          if (isAdvancePayment && monthAllocatedAmount < rentNum) {
            // Partial Advance Credit (Not full settled)
            card.className = 'month-card month-upcoming';
            card.style.cursor = 'pointer';
            card.title = 'Click to view payment receipt';
            card.addEventListener('click', () => {
              openPaymentReceipt(matchedPayment, t);
            });
            card.innerHTML = `
              <div class="month-card-left">
                <div class="month-badge" style="background-color: #E0F2FE; color: #0284C7;">⏩</div>
                <div class="month-details-col">
                  <strong class="month-name">${monthName} ${activeYear}</strong>
                  <span class="month-subtext">Paid on ${matchedPayment.payment_date} • ${(matchedPayment.payment_mode || 'Cash').toUpperCase()} (Advance Credit)</span>
                </div>
              </div>
              <div class="month-card-right">
                <span class="month-amount">₹${formatCurrencyAmount(monthAllocatedAmount)}</span>
                <span class="month-status-pill" style="background-color: #E0F2FE; color: #0284C7; border: 1px solid #BAE6FD;">⏩ Advance</span>
              </div>
            `;
          } else if (isPartialPayment && monthAllocatedAmount < rentNum) {
            // Partial Payment (Underpaid)
            dueCount++;
            card.className = 'month-card month-due';
            card.style.cursor = 'pointer';
            card.title = 'Click to record remaining rent payment';
            card.addEventListener('click', () => {
              currentActiveTenancy = t;
              openRecordPaymentPage(t);
            });
            card.innerHTML = `
              <div class="month-card-left">
                <div class="month-badge due">⚠️</div>
                <div class="month-details-col">
                  <strong class="month-name">${monthName} ${activeYear}</strong>
                  <span class="month-subtext">Partially paid on ${matchedPayment.payment_date} • ${(matchedPayment.payment_mode || 'Cash').toUpperCase()}</span>
                </div>
              </div>
              <div class="month-card-right">
                <span class="month-amount" style="color: #B45309;">₹${formatCurrencyAmount(monthAllocatedAmount)}</span>
                <span class="month-status-pill" style="background-color: #FEF3C7; color: #B45309; border: 1px solid #FDE68A;">⚠️ Partial</span>
              </div>
            `;
          } else {
            // Full Settled Payment
            paidCount++;
            card.className = 'month-card month-paid';
            card.style.cursor = 'pointer';
            card.title = 'Click to view payment receipt';
            card.addEventListener('click', () => {
              openPaymentReceipt(matchedPayment, t);
            });
            card.innerHTML = `
              <div class="month-card-left">
                <div class="month-badge paid">✔</div>
                <div class="month-details-col">
                  <strong class="month-name">${monthName} ${activeYear}</strong>
                  <span class="month-subtext">Paid on ${matchedPayment.payment_date} • ${(matchedPayment.payment_mode || 'Cash').toUpperCase()}</span>
                </div>
              </div>
              <div class="month-card-right">
                <span class="month-amount">₹${formatCurrencyAmount(monthAllocatedAmount)}</span>
                <span class="month-status-pill paid">✔ Settled</span>
              </div>
            `;
          }
        } else if (matchedBill) {
          dueCount++;
          card.className = 'month-card month-due';
          card.style.cursor = 'pointer';
          card.title = 'Click to record payment for this due bill';
          card.addEventListener('click', () => {
            currentActiveTenancy = t;
            openRecordPaymentPage(t);
          });
          card.innerHTML = `
            <div class="month-card-left">
              <div class="month-badge due">⚠️</div>
              <div class="month-details-col">
                <strong class="month-name">${monthName} ${activeYear}</strong>
                <span class="month-subtext">Billing overdue • Click to pay</span>
              </div>
            </div>
            <div class="month-card-right">
              <span class="month-amount" style="color: #DC2626;">₹${formatCurrencyAmount(matchedBill.net_payable)}</span>
              <span class="month-status-pill due">⚠️ Due</span>
            </div>
          `;
        } else if (activeYear === currentYear && idx === currentMonthIdx) {
          upcomingCount++;
          card.className = 'month-card month-upcoming';
          card.style.cursor = 'pointer';
          if (hasUtils) {
            card.title = 'Click to generate bill for this cycle';
            card.addEventListener('click', () => {
              currentActiveTenancy = t;
              setupGenerateBillScreen(t);
              navigateToScreen(13);
            });
            card.innerHTML = `
              <div class="month-card-left">
                <div class="month-badge upcoming">⏳</div>
                <div class="month-details-col">
                  <strong class="month-name">${monthName} ${activeYear}</strong>
                  <span class="month-subtext">Next billing • Click to generate</span>
                </div>
              </div>
              <div class="month-card-right">
                <span class="month-amount">₹${rentNum.toLocaleString('en-IN')}</span>
                <span class="month-status-pill upcoming">⏳ Next</span>
              </div>
            `;
          } else {
            card.title = 'Click to record payment for this month';
            card.addEventListener('click', () => {
              currentActiveTenancy = t;
              openRecordPaymentPage(t);
            });
            card.innerHTML = `
              <div class="month-card-left">
                <div class="month-badge upcoming">⏳</div>
                <div class="month-details-col">
                  <strong class="month-name">${monthName} ${activeYear}</strong>
                  <span class="month-subtext">Rent due • Click to pay</span>
                </div>
              </div>
              <div class="month-card-right">
                <span class="month-amount">₹${rentNum.toLocaleString('en-IN')}</span>
                <span class="month-status-pill upcoming">⏳ Due</span>
              </div>
            `;
          }
        } else if ((activeYear > currentYear) || (activeYear === currentYear && idx > currentMonthIdx)) {
          card.className = 'month-card month-future';
          card.innerHTML = `
            <div class="month-card-left">
              <div class="month-badge future">📅</div>
              <div class="month-details-col">
                <strong class="month-name">${monthName} ${activeYear}</strong>
                <span class="month-subtext">Scheduled cycle • ${getOrdinal(t.billing_day || 1)}</span>
              </div>
            </div>
            <div class="month-card-right">
              <span class="month-amount">₹${rentNum.toLocaleString('en-IN')}</span>
              <span class="month-status-pill future">Upcoming</span>
            </div>
          `;
        } else {
          // Past month after tenancy start that was not paid
          dueCount++;
          card.className = 'month-card month-due';
          card.style.cursor = 'pointer';
          card.title = 'Click to record overdue rent payment';
          card.addEventListener('click', () => {
            currentActiveTenancy = t;
            openRecordPaymentPage(t);
          });
          card.innerHTML = `
            <div class="month-card-left">
              <div class="month-badge due">⚠️</div>
              <div class="month-details-col">
                <strong class="month-name">${monthName} ${activeYear}</strong>
                <span class="month-subtext">Rent overdue • Click to pay</span>
              </div>
            </div>
            <div class="month-card-right">
              <span class="month-amount" style="color: #DC2626;">₹${rentNum.toLocaleString('en-IN')}</span>
              <span class="month-status-pill due">⚠️ Due</span>
            </div>
          `;
        }
        monthStack.appendChild(card);
      });
    }

    if (chipPaid) chipPaid.textContent = `✔ ${paidCount} Paid`;
    if (chipDue) chipDue.textContent = `⚠️ ${dueCount} Due`;
    if (chipUpcoming) chipUpcoming.textContent = `⏳ ${upcomingCount || 1} Next`;

    // 2. Populate History list
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
            <strong class="recent-item-amount">₹${formatCurrencyAmount(p.amount)}</strong>
            <svg class="recent-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </div>
        `;
        item.addEventListener('click', () => {
          openPaymentReceipt(p, t);
        });
        historyList.appendChild(item);
      });
    }

    // Default to Month-wise view: monthStack visible, emptyBills & historyList hidden
    const tabMonth = document.getElementById('tab-month-status');
    const tabHistory = document.getElementById('tab-bill-history');
    if (tabMonth?.classList.contains('active')) {
      viewMonth?.classList.remove('hidden');
      viewHistory?.classList.add('hidden');
      emptyBills?.classList.add('hidden');
    } else if (tabHistory?.classList.contains('active')) {
      viewMonth?.classList.add('hidden');
      if (tenancyPayments.length > 0) {
        viewHistory?.classList.remove('hidden');
        emptyBills?.classList.add('hidden');
      } else {
        viewHistory?.classList.add('hidden');
        emptyBills?.classList.remove('hidden');
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

  // Toggle 3-Dots Menu Dropdown reliably
  menuBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    menuDropdown?.classList.toggle('hidden');
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (menuDropdown && !menuDropdown.contains(e.target) && !menuBtn?.contains(e.target)) {
      menuDropdown.classList.add('hidden');
    }
  });

  // Menu action handlers
  actionEdit?.addEventListener('click', () => {
    menuDropdown?.classList.add('hidden');
    if (getTenancyUserRole(currentActiveTenancy) === 'viewer') {
      showToast('👁️ Viewers cannot edit property settings.');
      return;
    }
    if (currentActiveTenancy) {
      bindTenancyToDetails(currentActiveTenancy);
    }
    navigateToScreen(11);
  });

  actionArchive?.addEventListener('click', async () => {
    menuDropdown?.classList.add('hidden');
    if (getTenancyUserRole(currentActiveTenancy) === 'viewer') {
      showToast('👁️ Viewers cannot archive properties.');
      return;
    }
    if (currentActiveTenancy?.id) {
      const targetId = currentActiveTenancy.id;
      const targetName = currentActiveTenancy.property_name;
      try {
        await archiveCloudTenancy(targetId);
        cloudTenanciesList = cloudTenanciesList.filter(t => t.id !== targetId);
        currentActiveTenancy = null;
        showToast(`🗃️ Tenancy "${targetName}" archived in Supabase Cloud`);
        await syncDashboardFromCloud();
        navigateToScreen(6);
      } catch (e) {
        showToast(`❌ Archive error: ${e.message}`);
      }
    }
  });

  actionDelete?.addEventListener('click', async () => {
    menuDropdown?.classList.add('hidden');
    if (getTenancyUserRole(currentActiveTenancy) === 'viewer') {
      showToast('👁️ Viewers cannot delete properties.');
      return;
    }
    if (currentActiveTenancy?.id) {
      const targetId = currentActiveTenancy.id;
      const targetName = currentActiveTenancy.property_name;
      if (!confirm(`Are you sure you want to delete "${targetName}"?`)) return;
      try {
        await deleteCloudTenancy(targetId);
        cloudTenanciesList = cloudTenanciesList.filter(t => t.id !== targetId);
        currentActiveTenancy = null;
        showToast('🗑️ Tenancy deleted from Supabase Cloud');
        await syncDashboardFromCloud();
        navigateToScreen(6);
      } catch (e) {
        showToast(`❌ Delete error: ${e.message}`);
      }
    }
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
    tabHistory?.classList.remove('active');
    tabHistory?.setAttribute('aria-selected', 'false');
    if (viewTitle) viewTitle.textContent = 'Payment Status';

    viewMonth?.classList.remove('hidden');
    viewHistory?.classList.add('hidden');
    emptyBills?.classList.add('hidden');
  });

  tabHistory?.addEventListener('click', () => {
    tabHistory.classList.add('active');
    tabHistory.setAttribute('aria-selected', 'true');
    tabMonth?.classList.remove('active');
    tabMonth?.setAttribute('aria-selected', 'false');
    if (viewTitle) viewTitle.textContent = 'Rent Payment History';

    viewMonth?.classList.add('hidden');
    if (viewHistory && viewHistory.children.length > 0) {
      viewHistory.classList.remove('hidden');
      emptyBills?.classList.add('hidden');
    } else {
      viewHistory?.classList.add('hidden');
      emptyBills?.classList.remove('hidden');
    }
  });

  // Year Dropdown change: dynamically re-render month ledger for selected financial year
  const yearSelect = document.getElementById('details-year-select');
  const yearIndicator = document.getElementById('details-year-indicator');
  yearSelect?.addEventListener('change', () => {
    const val = parseInt(yearSelect.value, 10) || new Date().getFullYear();
    if (yearIndicator) {
      yearIndicator.textContent = `Year ${val} (Jan–Dec)`;
    }
    if (currentActiveTenancy) {
      bindTenancyToDetails(currentActiveTenancy, val);
    }
    showToast(`Showing payment records for Year ${val}`);
  });

  // Bottom Action Button: Generate New Bill (if utilities exist) or Record Payment (if rent-only)
  generateBillBtn?.addEventListener('click', () => {
    if (!currentActiveTenancy) return;
    if (tenancyHasUtilities(currentActiveTenancy)) {
      setupGenerateBillScreen(currentActiveTenancy);
      navigateToScreen(13);
    } else {
      openRecordPaymentPage(currentActiveTenancy);
    }
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
      const scheduled = await scheduleCloudRentRevision({
        tenancyId: currentActiveTenancy.id,
        oldRent: parseFloat(currentActiveTenancy.base_rent || 0),
        newRent: parseFloat(newRent),
        effectiveDate: new Date().toISOString().split('T')[0],
        note: document.getElementById('input-revise-reason')?.value || cycle,
        notifyTenant,
      });

      if (!currentActiveTenancy.rent_revisions) currentActiveTenancy.rent_revisions = [];
      if (scheduled) {
        currentActiveTenancy.rent_revisions.push(scheduled);
      } else {
        currentActiveTenancy.rent_revisions.push({
          tenancy_id: currentActiveTenancy.id,
          old_rent: parseFloat(currentActiveTenancy.base_rent || 0),
          new_rent: parseFloat(newRent),
          effective_date: new Date().toISOString().split('T')[0],
          note: cycle,
          status: 'scheduled',
        });
      }

      if (bannerRevisionText) {
        bannerRevisionText.textContent = `₹${parseFloat(newRent).toLocaleString('en-IN')} scheduled from ${cycle}`;
      }
      bannerRevision?.classList.remove('hidden');
      modalRevise?.classList.add('hidden');

      const msg = notifyTenant 
        ? `📈 Rent revision scheduled to ₹${parseFloat(newRent).toLocaleString('en-IN')} from ${cycle} (Tenant notified via WhatsApp & Cloud Synced)`
        : `📈 Rent revision scheduled to ₹${parseFloat(newRent).toLocaleString('en-IN')} from ${cycle} (Cloud Synced)`;
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
      if (currentActiveTenancy.rent_revisions) {
        currentActiveTenancy.rent_revisions.forEach(r => {
          if (r.status === 'scheduled') r.status = 'cancelled';
        });
      }
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
    const rawPhone = document.getElementById('edit-tenant-phone')?.value?.trim() || '';
    const updatedPhone = rawPhone.replace(/\D/g, '').slice(0, 10);
    const updatedAdvance = document.getElementById('edit-advance-amount')?.value?.trim();
    const nativeDate = document.getElementById('edit-native-billing-date');
    const editDateDisplay = document.getElementById('edit-billing-date-display');
    const editNativeStartDate = document.getElementById('edit-native-start-date');
    const updatedStartDate = editNativeStartDate?.value || currentActiveTenancy.start_date;

    let updatedDay = currentActiveTenancy.billing_day || 1;
    if (nativeDate?.value) {
      updatedDay = parseInt(nativeDate.value.split('-')[2], 10) || updatedDay;
    } else if (editDateDisplay?.value) {
      const match = editDateDisplay.value.match(/^(\d+)/);
      if (match) updatedDay = parseInt(match[1], 10) || updatedDay;
    }

    if (!updatedName) {
      showToast('⚠️ Property name cannot be empty');
      return;
    }

    if (rawPhone && updatedPhone.length !== 10) {
      showToast('⚠️ Phone number must be exactly 10 digits');
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
        billing_day: updatedDay,
        start_date: updatedStartDate,
      });

      // Synchronize utilities updates (Electricity & Water)
      const elecEnabled = document.getElementById('edit-toggle-elec')?.checked ?? true;
      const elecPrice = parseFloat(document.getElementById('edit-elec-price')?.value) || 0;
      const waterEnabled = document.getElementById('edit-toggle-water')?.checked ?? true;
      const waterAmount = parseFloat(document.getElementById('edit-water-amount')?.value) || 0;

      const existingElec = currentActiveTenancy.tenancy_utilities?.find(u => u.utility_type === 'electricity');
      const updatedUtils = [
        {
          utility_type: 'electricity',
          is_enabled: elecEnabled,
          bill_type: 'meter_reading',
          price_per_unit: elecPrice,
          flat_amount: 0,
          last_meter_reading: existingElec?.last_meter_reading || 0,
        },
        {
          utility_type: 'water',
          is_enabled: waterEnabled,
          bill_type: 'flat',
          price_per_unit: 0,
          flat_amount: waterAmount,
          last_meter_reading: 0,
        },
      ];

      try {
        await updateCloudTenancyUtilities(currentActiveTenancy.id, updatedUtils);
        currentActiveTenancy.tenancy_utilities = updatedUtils;
      } catch (utilErr) {
        console.warn('Update utilities notice:', utilErr);
      }

      currentActiveTenancy.property_name = updatedName;
      if (updatedRent) currentActiveTenancy.base_rent = parseFloat(updatedRent);
      if (updatedPhone) currentActiveTenancy.tenant_phone = updatedPhone;
      if (updatedAdvance) currentActiveTenancy.advance_amount = parseFloat(updatedAdvance);
      currentActiveTenancy.billing_day = updatedDay;
      currentActiveTenancy.start_date = updatedStartDate;

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

  // Tenancy Start Date picker trigger
  const startTrigger = document.getElementById('editStartDatePickerTrigger');
  const nativeStartDateInput = document.getElementById('edit-native-start-date');
  const startDateDisplay = document.getElementById('edit-start-date-display');

  const openEditStartDatePicker = () => {
    if (nativeStartDateInput && typeof nativeStartDateInput.showPicker === 'function') {
      try {
        nativeStartDateInput.showPicker();
      } catch (err) {
        nativeStartDateInput.focus();
      }
    } else {
      nativeStartDateInput?.focus();
    }
  };
  startTrigger?.addEventListener('click', openEditStartDatePicker);
  startDateDisplay?.addEventListener('click', openEditStartDatePicker);

  nativeStartDateInput?.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val && startDateDisplay) {
      const d = new Date(val + 'T00:00:00');
      startDateDisplay.value = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
      showToast(`Tenancy start date set to ${startDateDisplay.value}`);
    }
  });

  // Recurring Billing Date picker trigger
  const trigger = document.getElementById('editDatePickerTrigger');
  const nativeDate = document.getElementById('edit-native-billing-date');
  const dateDisplay = document.getElementById('edit-billing-date-display');

  const openEditDatePicker = () => {
    if (nativeDate && typeof nativeDate.showPicker === 'function') {
      try {
        nativeDate.showPicker();
      } catch (err) {
        nativeDate.focus();
      }
    } else {
      nativeDate?.focus();
    }
  };
  trigger?.addEventListener('click', openEditDatePicker);
  dateDisplay?.addEventListener('click', openEditDatePicker);

  nativeDate?.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val && dateDisplay) {
      const day = parseInt(val.split('-')[2], 10);
      if (!isNaN(day)) {
        const formatted = getOrdinal(day);
        dateDisplay.value = `${formatted} of every month`;
        showToast(`Recurring billing date set to ${formatted} of every month`);
      }
    }
  });

  // Billing cycle radios
  const cycleRadios = document.querySelectorAll('input[name="edit-billing-cycle"]');
  cycleRadios.forEach((radio) => {
    radio.parentElement?.addEventListener('click', () => {
      document.querySelectorAll('.radio-card.mini-radio[id^="edit-cycle-"]').forEach((c) => c.classList.remove('selected'));
      radio.parentElement?.classList.add('selected');
      radio.checked = true;
      const isYearly = radio.value === 'Yearly';
      const label = document.getElementById('label-edit-billing-date');
      if (label) label.textContent = isYearly ? 'Recurring Billing Date (day & month of every year)' : 'Recurring Billing Date (date of the month)';
      const editDisplay = document.getElementById('edit-billing-date-display');
      const editNative = document.getElementById('edit-native-billing-date');
      if (editDisplay && editNative?.value) {
        const d = new Date(editNative.value + 'T00:00:00');
        if (!isNaN(d.getTime())) {
          const ord = getOrdinal(d.getDate());
          const m = d.toLocaleDateString('en-US', { month: 'long' });
          editDisplay.value = isYearly ? `${ord} ${m} of every year` : `${ord} of every month`;
        }
      }
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

  if (target && getTenancyUserRole(target) === 'viewer') {
    showToast(`👁️ Viewers have read-only access to "${target.property_name}". You cannot record payments.`, 3500);
    return;
  }

  setupRecordPaymentForm(target);
  navigateToScreen(12);
}

export function getTenancyPaidSummaryByMonth(tenancy) {
  const tenancyPayments = (cloudPaymentsList || []).filter((p) => p.tenancy_id === tenancy.id);
  const baseRent = parseFloat(tenancy.base_rent || 0);
  const paidMap = {};

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  tenancyPayments.forEach((p) => {
    let pDateYear = null;
    let pDateMonthName = null;
    if (p.payment_date) {
      const pDate = new Date(p.payment_date + 'T00:00:00');
      if (!isNaN(pDate.getTime())) {
        pDateYear = pDate.getFullYear();
        pDateMonthName = MONTH_NAMES[pDate.getMonth()];
      }
    }

    if (Array.isArray(p.settled_months) && p.settled_months.length > 0) {
      const entries = [];
      p.settled_months.forEach((raw) => {
        if (!raw) return;
        const str = raw.toString();
        const monthMatches = [];
        MONTH_NAMES.forEach((m) => {
          const regex = new RegExp(`\\b${m}\\b`, 'gi');
          let mMatch;
          while ((mMatch = regex.exec(str)) !== null) {
            monthMatches.push({ month: m, index: mMatch.index });
          }
        });

        if (monthMatches.length <= 1) {
          entries.push(str);
        } else {
          monthMatches.sort((a, b) => a.index - b.index);
          for (let k = 0; k < monthMatches.length; k++) {
            const start = monthMatches[k].index;
            const end = k + 1 < monthMatches.length ? monthMatches[k + 1].index : str.length;
            entries.push(str.substring(start, end).replace(/^[,\s]+|[,\s]+$/g, ''));
          }
        }
      });

      entries.forEach((entryStr) => {
        const matchedM = MONTH_NAMES.find((m) => new RegExp(`\\b${m}\\b`, 'i').test(entryStr));
        if (!matchedM) return;

        const yearMatch = entryStr.match(/\b(20\d\d)\b/);
        const entryYear = yearMatch ? parseInt(yearMatch[1], 10) : (pDateYear || new Date().getFullYear());
        const key = `${matchedM} ${entryYear}`;

        const isAdv = /advance/i.test(entryStr);
        let allocatedAmt = 0;
        const amtMatch = entryStr.match(/(?:₹|Rs\.?)\s*([\d,]+(?:\.\d+)?)/i);
        if (amtMatch) {
          allocatedAmt = parseFloat(amtMatch[1].replace(/,/g, '')) || 0;
        } else if (entries.length === 1) {
          allocatedAmt = parseFloat(p.amount) || baseRent;
        } else {
          if (isAdv) {
            allocatedAmt = Math.max(0, parseFloat(p.amount) - baseRent) || baseRent;
          } else {
            allocatedAmt = Math.min(baseRent, parseFloat(p.amount)) || baseRent;
          }
        }

        if (!paidMap[key]) {
          paidMap[key] = { totalPaid: 0, hasAdvanceCredit: false };
        }
        paidMap[key].totalPaid += allocatedAmt;
        if (isAdv) paidMap[key].hasAdvanceCredit = true;
      });
    } else if (pDateMonthName && pDateYear) {
      const key = `${pDateMonthName} ${pDateYear}`;
      if (!paidMap[key]) {
        paidMap[key] = { totalPaid: 0, hasAdvanceCredit: false };
      }
      const amt = parseFloat(p.amount) || baseRent;
      paidMap[key].totalPaid += amt;
    }
  });

  return paidMap;
}

export function getEarliestUnsettledCycle(tenancy) {
  const baseRent = parseFloat(tenancy.base_rent || 0);
  const paidMap = getTenancyPaidSummaryByMonth(tenancy);
  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const now = new Date();
  const currentMonthIdx = now.getMonth();
  const currentYear = now.getFullYear();
  const currMonthLabel = `${MONTH_NAMES[currentMonthIdx]} ${currentYear}`;

  const hasUtils = tenancyHasUtilities(tenancy);
  const unpaidBills = hasUtils
    ? (cloudBillsList || []).filter((b) => b.tenancy_id === tenancy.id && b.status === 'unpaid')
    : [];

  // 1. Check past unpaid bills (if utilities enabled)
  if (unpaidBills.length > 0) {
    const sortedBills = [...unpaidBills].sort((a, b) => (a.duration_start || '').localeCompare(b.duration_start || ''));
    for (const b of sortedBills) {
      const mLabel = b.duration_start
        ? new Date(b.duration_start + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : 'Billing Cycle';
      const billPayable = parseFloat(b.net_payable) || baseRent;
      const prevPaid = paidMap[mLabel]?.totalPaid || 0;
      const netDue = Math.max(0, billPayable - prevPaid);
      if (netDue > 0) {
        return {
          monthLabel: mLabel,
          due: billPayable,
          alreadyPaid: prevPaid,
          netDue: netDue,
          isPastDue: true,
          isCurrent: false,
          isAdvance: false,
          billId: b.id,
        };
      }
    }
  }

  // 2. Check past rent months (if rent only)
  if (!hasUtils) {
    const tenancyStart = tenancy.created_at ? new Date(tenancy.created_at) : new Date(2026, 0, 1);
    const startYear = tenancyStart.getFullYear();
    const startMonth = tenancyStart.getMonth();
    let iterDate = new Date(startYear, startMonth, 1);
    const currentDateFirst = new Date(currentYear, currentMonthIdx, 1);

    while (iterDate < currentDateFirst) {
      const mIdx = iterDate.getMonth();
      const yr = iterDate.getFullYear();
      const mLabel = `${MONTH_NAMES[mIdx]} ${yr}`;
      const prevPaid = paidMap[mLabel]?.totalPaid || 0;
      const netDue = Math.max(0, baseRent - prevPaid);

      if (netDue > 0) {
        return {
          monthLabel: mLabel,
          due: baseRent,
          alreadyPaid: prevPaid,
          netDue: netDue,
          isPastDue: true,
          isCurrent: false,
          isAdvance: false,
          billId: null,
        };
      }
      iterDate.setMonth(iterDate.getMonth() + 1);
    }
  }

  // 3. Check Current Month
  const currPaid = paidMap[currMonthLabel]?.totalPaid || 0;
  const currNetDue = Math.max(0, baseRent - currPaid);
  if (currNetDue > 0) {
    return {
      monthLabel: currMonthLabel,
      due: baseRent,
      alreadyPaid: currPaid,
      netDue: currNetDue,
      isPastDue: false,
      isCurrent: true,
      isAdvance: false,
      billId: null,
    };
  }

  // 4. Current month is fully settled, search future advance cycles
  for (let advIdx = 1; advIdx <= 12; advIdx++) {
    const advDate = new Date(currentYear, currentMonthIdx + advIdx, 1);
    const advLabel = `${MONTH_NAMES[advDate.getMonth()]} ${advDate.getFullYear()}`;
    const advPrevPaid = paidMap[advLabel]?.totalPaid || 0;
    const advNetDue = Math.max(0, baseRent - advPrevPaid);
    if (advNetDue > 0) {
      return {
        monthLabel: advLabel,
        due: baseRent,
        alreadyPaid: advPrevPaid,
        netDue: advNetDue,
        isPastDue: false,
        isCurrent: false,
        isAdvance: true,
        billId: null,
      };
    }
  }

  return {
    monthLabel: `${MONTH_NAMES[(currentMonthIdx + 1) % 12]} ${currentYear}`,
    due: baseRent,
    alreadyPaid: 0,
    netDue: baseRent,
    isPastDue: false,
    isCurrent: false,
    isAdvance: true,
    billId: null,
  };
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

  // Compute earliest unsettled cycle and set optimal default payment amount & hint
  const nextCycle = getEarliestUnsettledCycle(tenancy);
  const dueHint = document.getElementById('record-due-hint');
  const amountInput = document.getElementById('record-page-amount');

  if (dueHint) {
    if (nextCycle.isPastDue) {
      dueHint.textContent = `Past Due: ₹${formatCurrencyAmount(nextCycle.netDue)} (${nextCycle.monthLabel})`;
      dueHint.style.color = '#DC2626';
    } else if (nextCycle.isCurrent) {
      if (nextCycle.alreadyPaid > 0) {
        dueHint.textContent = `Balance Due: ₹${formatCurrencyAmount(nextCycle.netDue)} (₹${formatCurrencyAmount(nextCycle.alreadyPaid)} prev. paid)`;
        dueHint.style.color = '#B45309';
      } else {
        dueHint.textContent = `Rent: ₹${formatCurrencyAmount(baseRent)}`;
        dueHint.style.color = '#5452EC';
      }
    } else {
      // Future / Advance Cycle
      if (nextCycle.alreadyPaid > 0) {
        dueHint.textContent = `Next Cycle: ₹${formatCurrencyAmount(nextCycle.netDue)} (₹${formatCurrencyAmount(nextCycle.alreadyPaid)} Adv. applied)`;
      } else {
        dueHint.textContent = `Next Cycle: ₹${formatCurrencyAmount(baseRent)} (${nextCycle.monthLabel})`;
      }
      dueHint.style.color = '#5452EC';
    }
  }

  if (amountInput) {
    amountInput.value = nextCycle.netDue > 0 ? nextCycle.netDue : (baseRent > 0 ? baseRent : '');
  }

  // Shortcut chips removed per user preference
  const chipsContainer = document.querySelector('.amount-shortcut-chips');
  if (chipsContainer) {
    chipsContainer.innerHTML = '';
    chipsContainer.style.display = 'none';
  }

  // Initialize payment date inputs to current date if blank
  const nativeDate = document.getElementById('record-native-payment-date');
  const dateDisplay = document.getElementById('record-payment-date-display');
  const now = new Date();
  const todayIso = now.toISOString().split('T')[0];
  if (nativeDate && !nativeDate.value) nativeDate.value = todayIso;
  if (dateDisplay && (!dateDisplay.value || dateDisplay.value === '')) {
    dateDisplay.value = now.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  // Render initial waterfall breakdown
  renderWaterfallBreakdown(tenancy);
}

export function computeWaterfallAllocations(tenancy, amountVal) {
  const baseRent = parseFloat(tenancy.base_rent || 0);
  const amount = parseFloat(amountVal) || 0;
  let remaining = amount;
  const allocations = [];

  const hasUtils = tenancyHasUtilities(tenancy);
  const unpaidBills = hasUtils
    ? (cloudBillsList || []).filter((b) => b.tenancy_id === tenancy.id && b.status === 'unpaid')
    : [];

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const now = new Date();
  const currentMonthIdx = now.getMonth();
  const currentYear = now.getFullYear();
  const currMonthLabel = `${MONTH_NAMES[currentMonthIdx]} ${currentYear}`;

  const paidMap = getTenancyPaidSummaryByMonth(tenancy);

  // 1. Gather all past overdue items (chronological oldest to newest)
  const overdueQueue = [];
  if (unpaidBills.length > 0) {
    const sortedBills = [...unpaidBills].sort((a, b) => (a.duration_start || '').localeCompare(b.duration_start || ''));
    sortedBills.forEach((b) => {
      const mLabel = b.duration_start
        ? new Date(b.duration_start + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : 'Billing Cycle';
      const billPayable = parseFloat(b.net_payable) || baseRent;
      const prevPaid = paidMap[mLabel]?.totalPaid || 0;
      const netDue = Math.max(0, billPayable - prevPaid);
      if (netDue > 0) {
        overdueQueue.push({
          monthLabel: mLabel,
          due: billPayable,
          alreadyPaid: prevPaid,
          netDue: netDue,
          billId: b.id,
          isPastDue: true,
        });
      }
    });
  } else if (!hasUtils) {
    const tenancyStart = tenancy.created_at ? new Date(tenancy.created_at) : new Date(2026, 0, 1);
    const startYear = tenancyStart.getFullYear();
    const startMonth = tenancyStart.getMonth();
    let iterDate = new Date(startYear, startMonth, 1);
    const currentDateFirst = new Date(currentYear, currentMonthIdx, 1);

    while (iterDate < currentDateFirst) {
      const mIdx = iterDate.getMonth();
      const yr = iterDate.getFullYear();
      const mLabel = `${MONTH_NAMES[mIdx]} ${yr}`;
      const prevPaid = paidMap[mLabel]?.totalPaid || 0;
      const netDue = Math.max(0, baseRent - prevPaid);

      if (netDue > 0) {
        overdueQueue.push({
          monthLabel: mLabel,
          due: baseRent,
          alreadyPaid: prevPaid,
          netDue: netDue,
          billId: null,
          isPastDue: true,
        });
      }
      iterDate.setMonth(iterDate.getMonth() + 1);
    }
  }

  // Step 1: Waterfall across Past Overdue Months
  overdueQueue.forEach((item) => {
    const targetNeed = item.netDue;
    if (remaining <= 0) {
      allocations.push({
        monthLabel: item.monthLabel,
        allocated: 0,
        due: item.due,
        alreadyPaid: item.alreadyPaid,
        balanceLeft: item.netDue,
        status: 'unpaid',
        type: 'past_due',
        billId: item.billId,
        badgeText: 'Due',
        badgeClass: 'badge-overdue',
        icon: '⚠️',
        noteText: item.alreadyPaid > 0
          ? `₹${formatCurrencyAmount(item.alreadyPaid)} paid • ₹${formatCurrencyAmount(item.netDue)} due`
          : 'Past due balance',
      });
      return;
    }

    if (remaining >= targetNeed) {
      allocations.push({
        monthLabel: item.monthLabel,
        allocated: targetNeed,
        due: item.due,
        alreadyPaid: item.alreadyPaid,
        balanceLeft: 0,
        status: 'settled',
        type: 'past_due',
        billId: item.billId,
        badgeText: 'Cleared',
        badgeClass: 'badge-settled',
        icon: '✓',
        noteText: item.alreadyPaid > 0
          ? `₹${formatCurrencyAmount(item.alreadyPaid)} prev. • Balance cleared`
          : 'Past due cleared',
      });
      remaining -= targetNeed;
    } else {
      const bal = targetNeed - remaining;
      allocations.push({
        monthLabel: item.monthLabel,
        allocated: remaining,
        due: item.due,
        alreadyPaid: item.alreadyPaid,
        balanceLeft: bal,
        status: 'partial',
        type: 'past_due',
        billId: item.billId,
        badgeText: 'Partial',
        badgeClass: 'badge-partial',
        icon: '⚠️',
        noteText: `₹${formatCurrencyAmount(bal)} due`,
      });
      remaining = 0;
    }
  });

  // Step 2: Waterfall to Current Month
  const currentMonthAlreadyInQueue = overdueQueue.some((o) => o.monthLabel.toLowerCase() === currMonthLabel.toLowerCase());
  if (!currentMonthAlreadyInQueue) {
    const currPaid = paidMap[currMonthLabel]?.totalPaid || 0;
    const currNetDue = Math.max(0, baseRent - currPaid);

    if (currNetDue > 0) {
      if (remaining >= currNetDue) {
        allocations.push({
          monthLabel: currMonthLabel,
          allocated: currNetDue,
          due: baseRent,
          alreadyPaid: currPaid,
          balanceLeft: 0,
          status: 'settled',
          type: 'current',
          billId: null,
          badgeText: currPaid > 0 ? 'Cleared' : 'Paid',
          badgeClass: 'badge-settled',
          icon: '✓',
          noteText: currPaid > 0
            ? `₹${formatCurrencyAmount(currPaid)} prev. • Fully cleared`
            : 'Current cycle',
        });
        remaining -= currNetDue;
      } else if (remaining > 0) {
        const bal = currNetDue - remaining;
        allocations.push({
          monthLabel: currMonthLabel,
          allocated: remaining,
          due: baseRent,
          alreadyPaid: currPaid,
          balanceLeft: bal,
          status: 'partial',
          type: 'current',
          billId: null,
          badgeText: 'Partial',
          badgeClass: 'badge-partial',
          icon: '⚠️',
          noteText: `₹${formatCurrencyAmount(bal)} due`,
        });
        remaining = 0;
      } else if (allocations.length === 0) {
        allocations.push({
          monthLabel: currMonthLabel,
          allocated: 0,
          due: baseRent,
          alreadyPaid: currPaid,
          balanceLeft: currNetDue,
          status: 'unpaid',
          type: 'current',
          billId: null,
          badgeText: 'Due',
          badgeClass: 'badge-overdue',
          icon: '📅',
          noteText: currPaid > 0
            ? `₹${formatCurrencyAmount(currPaid)} prev. • ₹${formatCurrencyAmount(currNetDue)} due`
            : 'Current cycle',
        });
      }
    }
  }

  // Step 3: Waterfall to Future Advance Months
  let advIndex = 1;
  while (remaining > 0 && advIndex <= 12) {
    const advDate = new Date(currentYear, currentMonthIdx + advIndex, 1);
    const advLabel = `${MONTH_NAMES[advDate.getMonth()]} ${advDate.getFullYear()}`;
    const advPrevPaid = paidMap[advLabel]?.totalPaid || 0;
    const advNetDue = Math.max(0, baseRent - advPrevPaid);

    if (advNetDue <= 0) {
      advIndex++;
      continue;
    }

    if (remaining >= advNetDue) {
      allocations.push({
        monthLabel: advLabel,
        allocated: advNetDue,
        due: baseRent,
        alreadyPaid: advPrevPaid,
        balanceLeft: 0,
        status: 'advance',
        type: 'advance',
        billId: null,
        badgeText: advPrevPaid > 0 ? 'Adv. Cleared' : 'Advance',
        badgeClass: 'badge-advance',
        icon: '⏩',
        noteText: advPrevPaid > 0
          ? `₹${formatCurrencyAmount(advPrevPaid)} adv. adjusted • Fully cleared`
          : 'Advance credit',
      });
      remaining -= advNetDue;
    } else {
      allocations.push({
        monthLabel: advLabel,
        allocated: remaining,
        due: baseRent,
        alreadyPaid: advPrevPaid,
        balanceLeft: advNetDue - remaining,
        status: 'advance',
        type: 'advance',
        billId: null,
        badgeText: 'Advance',
        badgeClass: 'badge-advance',
        icon: '⏩',
        noteText: advPrevPaid > 0
          ? `₹${formatCurrencyAmount(advPrevPaid)} adv. adjusted • ₹${formatCurrencyAmount(advNetDue - remaining)} due`
          : 'Advance credit',
      });
      remaining = 0;
      break;
    }
    advIndex++;
  }

  // Fallback: If remaining === 0 and allocations is empty (e.g. current month already paid and amount entered is 0)
  if (allocations.length === 0) {
    let advIdx = 1;
    while (advIdx <= 12) {
      const advDate = new Date(currentYear, currentMonthIdx + advIdx, 1);
      const advLabel = `${MONTH_NAMES[advDate.getMonth()]} ${advDate.getFullYear()}`;
      const advPrevPaid = paidMap[advLabel]?.totalPaid || 0;
      const advNetDue = Math.max(0, baseRent - advPrevPaid);
      if (advNetDue > 0) {
        allocations.push({
          monthLabel: advLabel,
          allocated: 0,
          due: baseRent,
          alreadyPaid: advPrevPaid,
          balanceLeft: advNetDue,
          status: 'advance',
          type: 'advance',
          billId: null,
          badgeText: 'Upcoming',
          badgeClass: 'badge-advance',
          icon: '📅',
          noteText: advPrevPaid > 0
            ? `₹${formatCurrencyAmount(advPrevPaid)} adv. applied • ₹${formatCurrencyAmount(advNetDue)} remaining`
            : 'Next cycle',
        });
        break;
      }
      advIdx++;
    }
  }

  return allocations;
}

export function renderWaterfallBreakdown(tenancy) {
  if (!tenancy) return;
  const listContainer = document.getElementById('waterfall-items-list');
  const amountInput = document.getElementById('record-page-amount');
  const totalAllocatedEl = document.getElementById('waterfall-total-allocated');
  const balanceRow = document.getElementById('waterfall-balance-row');
  const remainingBalanceEl = document.getElementById('waterfall-remaining-balance');

  if (!listContainer) return;
  listContainer.innerHTML = '';

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const now = new Date();
  const currentMonthIdx = now.getMonth();
  const currentYear = now.getFullYear();
  const currMonthLabel = `${MONTH_NAMES[currentMonthIdx]} ${currentYear}`;
  const baseRent = parseFloat(tenancy.base_rent || 0);

  const paidMap = getTenancyPaidSummaryByMonth(tenancy);
  const currPaid = paidMap[currMonthLabel]?.totalPaid || 0;

  // If current month is already 100% paid, show a prominent reassuring check notice
  if (currPaid >= baseRent && baseRent > 0) {
    const notice = document.createElement('div');
    notice.className = 'waterfall-settled-notice';
    notice.innerHTML = `
      <span class="notice-check">✓</span>
      <span><strong>${currMonthLabel}</strong> is already fully settled (₹${formatCurrencyAmount(currPaid)} paid). Payment applies to upcoming cycle.</span>
    `;
    listContainer.appendChild(notice);
  }

  const amountVal = parseFloat(amountInput?.value || 0) || 0;
  const allocations = computeWaterfallAllocations(tenancy, amountVal);
  let totalBalanceLeft = 0;

  allocations.forEach((item) => {
    if (item.balanceLeft > 0 && item.type !== 'advance' && item.status !== 'unpaid') {
      totalBalanceLeft += item.balanceLeft;
    }

    const card = document.createElement('div');
    let cardClass = 'waterfall-item-card';
    if (item.status === 'settled') cardClass += ' settled';
    else if (item.status === 'partial') cardClass += ' partial';
    else if (item.status === 'advance') cardClass += ' advance';
    else if (item.status === 'unpaid') cardClass += ' past-due';

    card.className = cardClass;
    card.innerHTML = `
      <div class="waterfall-card-top-row">
        <div class="waterfall-card-month-group">
          <span class="waterfall-status-icon">${item.icon}</span>
          <strong class="waterfall-month-title">${item.monthLabel}</strong>
        </div>
        <span class="waterfall-amount-applied">₹${formatCurrencyAmount(item.allocated || 0)}</span>
      </div>
      <div class="waterfall-card-bottom-row">
        <span class="waterfall-month-note">${item.noteText}</span>
        <span class="badge-pill ${item.badgeClass}">${item.badgeText}</span>
      </div>
    `;
    listContainer.appendChild(card);
  });

  if (totalAllocatedEl) {
    totalAllocatedEl.textContent = `₹${formatCurrencyAmount(amountVal)}`;
  }

  if (totalBalanceLeft > 0) {
    balanceRow?.classList.remove('hidden');
    if (remainingBalanceEl) {
      remainingBalanceEl.textContent = `₹${formatCurrencyAmount(totalBalanceLeft)}`;
    }
  } else {
    balanceRow?.classList.add('hidden');
  }
}

function initRecordPaymentPage() {
  const selectTenancy = document.getElementById('record-page-tenancy');
  const btnBack = document.getElementById('btn-record-page-back');
  const cardCash = document.getElementById('card-mode-cash');
  const cardOnline = document.getElementById('card-mode-online');
  const onlineSubfields = document.getElementById('online-channel-subfields');
  const channelChips = document.querySelectorAll('.channel-chips-row .channel-chip');
  const amountInput = document.getElementById('record-page-amount');
  const btnSave = document.getElementById('btn-save-full-payment');

  // Live real-time waterfall allocation as user types
  amountInput?.addEventListener('input', () => {
    if (selectedRecordTenancy) {
      renderWaterfallBreakdown(selectedRecordTenancy);
    }
  });

  selectTenancy?.addEventListener('change', (e) => {
    const target = (cloudTenanciesList || []).find((t) => t.id === e.target.value);
    if (target) setupRecordPaymentForm(target);
  });

  btnBack?.addEventListener('click', () => {
    if (state.previousScreen === 10 && currentActiveTenancy) {
      navigateToScreen(10);
    } else {
      navigateToScreen(6);
    }
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

  const openPaymentDatePicker = () => {
    if (nativeDate && typeof nativeDate.showPicker === 'function') {
      try {
        nativeDate.showPicker();
      } catch (err) {
        nativeDate.focus();
      }
    } else {
      nativeDate?.focus();
    }
  };
  trigger?.addEventListener('click', openPaymentDatePicker);
  dateDisplay?.addEventListener('click', openPaymentDatePicker);

  nativeDate?.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val && dateDisplay) {
      const d = new Date(val + 'T00:00:00');
      const formatted = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
      dateDisplay.value = formatted;
      showToast(`Payment date set to ${formatted}`);
    }
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
      const selectedChannelVal = document.querySelector('input[name="online-channel"]:checked')?.value || 'GPay / UPI';
      if (selectedChannelVal.includes('GPay') || selectedChannelVal.includes('UPI')) channel = 'upi';
      else if (selectedChannelVal.includes('NEFT') || selectedChannelVal.includes('Bank')) channel = 'neft';
      else channel = 'other';
      modeLabel = channel.toUpperCase();
      ref = document.getElementById('input-online-ref')?.value?.trim() || null;
      if (ref) modeLabel += ` (Ref: ${ref})`;
    }

    // Determine settled months and bills using pure waterfall engine
    const allocations = computeWaterfallAllocations(selectedRecordTenancy, amountVal);
    const activeAllocations = allocations.filter((a) => (a.allocated || 0) > 0);
    let settledMonths = activeAllocations.map((a) => {
      if (a.type === 'advance') {
        if (a.balanceLeft === 0) {
          return `${a.monthLabel} (₹${formatCurrencyAmount(a.allocated)})`;
        }
        return `${a.monthLabel} (Advance: ₹${formatCurrencyAmount(a.allocated)})`;
      }
      if (a.status === 'partial') {
        return `${a.monthLabel} (Partial: ₹${formatCurrencyAmount(a.allocated)}/${formatCurrencyAmount(a.due)})`;
      }
      return `${a.monthLabel} (₹${formatCurrencyAmount(a.allocated)})`;
    });
    let settledBillIds = activeAllocations.filter((a) => a.status === 'settled' && a.billId).map((a) => a.billId);

    if (settledMonths.length === 0) {
      settledMonths = [new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })];
    }

    const notes = document.getElementById('record-payment-notes')?.value?.trim();
    const sendWhatsApp = document.getElementById('toggle-send-whatsapp-receipt')?.checked;
    const paymentDate = nativeDate?.value || new Date().toISOString().split('T')[0];

    btnSave.disabled = true;
    btnSave.textContent = 'Saving Payment...';

    try {
      const recordedPayment = await recordCloudPayment({
        tenancyId: selectedRecordTenancy.id,
        amount: parseFloat(amountVal),
        paymentMode: payMode.toLowerCase() === 'online' ? 'online' : 'cash',
        channel: channel,
        referenceNo: ref,
        settledMonths: settledMonths,
        settledBillIds: settledBillIds,
        billId: settledBillIds[0] || null,
        paymentDate: paymentDate,
      });

      await syncDashboardFromCloud();

      const toastMsg = sendWhatsApp
        ? `✅ ₹${parseFloat(amountVal).toLocaleString('en-IN')} recorded for ${selectedRecordTenancy.property_name}! Opening receipt...`
        : `✅ ₹${parseFloat(amountVal).toLocaleString('en-IN')} recorded! Opening receipt...`;

      showToast(toastMsg, 2500);

      setTimeout(() => {
        openPaymentReceipt(recordedPayment || (cloudPaymentsList && cloudPaymentsList[0]), selectedRecordTenancy);
      }, 400);
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

export function setupGenerateBillScreen(target) {
  if (!target) return;
  if (!tenancyHasUtilities(target)) {
    showToast(`ℹ️ "${target.property_name}" is a rent-only tenancy. Use "Record Payment" to record rent.`, 3500);
    openRecordPaymentPage(target);
    return;
  }
  currentActiveTenancy = target;

  const subtitle = document.getElementById('genbill-subtitle');
  if (subtitle) subtitle.textContent = `for ${target.property_name}`;

  const elecUtil = target.tenancy_utilities?.find((u) => u.utility_type === 'electricity' && u.is_enabled !== false);
  const waterUtil = target.tenancy_utilities?.find((u) => u.utility_type === 'water' && u.is_enabled !== false);

  const groupPrevElec = document.getElementById('group-prev-elec');
  const groupCurrElec = document.getElementById('group-curr-elec');
  const prevElecInput = document.getElementById('input-prev-elec');
  const currElecInput = document.getElementById('input-curr-elec');

  if (elecUtil) {
    groupPrevElec?.classList.remove('hidden');
    groupCurrElec?.classList.remove('hidden');
    if (prevElecInput) prevElecInput.value = (elecUtil.last_meter_reading ?? 0).toFixed(2);
    if (currElecInput) {
      currElecInput.value = '';
      currElecInput.required = true;
    }
  } else {
    groupPrevElec?.classList.add('hidden');
    groupCurrElec?.classList.add('hidden');
    if (currElecInput) {
      currElecInput.value = '0';
      currElecInput.required = false;
    }
  }

  const groupPrevWater = document.getElementById('group-prev-water');
  const groupCurrWater = document.getElementById('group-curr-water');
  const prevWaterInput = document.getElementById('input-prev-water');
  const currWaterInput = document.getElementById('input-curr-water');

  if (waterUtil && waterUtil.bill_type === 'meter_reading') {
    groupPrevWater?.classList.remove('hidden');
    groupCurrWater?.classList.remove('hidden');
    if (prevWaterInput) prevWaterInput.value = (waterUtil.last_meter_reading ?? 0).toFixed(2);
    if (currWaterInput) currWaterInput.value = '';
  } else {
    groupPrevWater?.classList.add('hidden');
    groupCurrWater?.classList.add('hidden');
    if (currWaterInput) currWaterInput.value = '0';
  }

  const advanceInput = document.getElementById('input-bill-advance');
  if (advanceInput) advanceInput.value = '';

  const dueInput = document.getElementById('input-bill-due');
  const unpaidPastBills = (cloudBillsList || []).filter(
    (b) => b.tenancy_id === target.id && b.status === 'unpaid'
  );
  const totalPastDue = unpaidPastBills.reduce((acc, b) => acc + parseFloat(b.net_payable || 0), 0);
  if (dueInput) dueInput.value = totalPastDue > 0 ? totalPastDue : '';

  const notesInput = document.getElementById('input-bill-notes');
  if (notesInput) notesInput.value = '';

  // Dates setup
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const firstDay = new Date(y, m, 1);
  const lastDay = new Date(y, m + 1, 0);

  const startNative = document.getElementById('bill-native-start-date');
  const startDisplay = document.getElementById('bill-start-date-display');
  if (startNative) startNative.value = firstDay.toISOString().split('T')[0];
  if (startDisplay) startDisplay.value = firstDay.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

  const endNative = document.getElementById('bill-native-end-date');
  const endDisplay = document.getElementById('bill-end-date-display');
  if (endNative) endNative.value = lastDay.toISOString().split('T')[0];
  if (endDisplay) endDisplay.value = lastDay.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function renderBillDetails(b) {
  if (!b) return;
  activeBillDraft = b;

  const propTitle = document.getElementById('details-bill-prop-title');
  if (propTitle) propTitle.textContent = b.propertyName || b.property_name || b.tenancies?.property_name || 'Property';

  const durationEl = document.getElementById('details-bill-duration');
  if (durationEl) {
    const s = b.durationStart || b.duration_start || '';
    const e = b.durationEnd || b.duration_end || '';
    durationEl.textContent = `${s} – ${e}`;
  }

  const genDateEl = document.getElementById('details-bill-gendate');
  if (genDateEl) genDateEl.textContent = b.generatedDate || b.generated_date || new Date().toISOString().split('T')[0];

  const rentVal = document.getElementById('details-bill-rent-val');
  if (rentVal) rentVal.textContent = `₹${formatCurrencyAmount(b.baseRent || b.base_rent || 0)}`;

  const elecUnits = b.electricityUnits ?? b.electricity_units ?? 0;
  const elecCost = b.electricityCost ?? b.electricity_cost ?? 0;
  const elecSub = document.getElementById('details-bill-elec-sub');
  if (elecSub) elecSub.textContent = `${elecUnits} units`;
  const elecVal = document.getElementById('details-bill-elec-val');
  if (elecVal) elecVal.textContent = `₹${formatCurrencyAmount(elecCost)}`;

  const waterCost = b.waterCost ?? b.water_cost ?? 0;
  const waterVal = document.getElementById('details-bill-water-val');
  if (waterVal) waterVal.textContent = `₹${formatCurrencyAmount(waterCost)}`;

  const internetCost = b.internetCost ?? b.internet_cost ?? 0;
  const internetVal = document.getElementById('details-bill-internet-val');
  if (internetVal) internetVal.textContent = `₹${formatCurrencyAmount(internetCost)}`;

  const sewageCost = b.sewageCost ?? b.otherUtilitiesCost ?? b.other_utilities_cost ?? 0;
  const sewageVal = document.getElementById('details-bill-sewage-val');
  if (sewageVal) sewageVal.textContent = `₹${formatCurrencyAmount(sewageCost)}`;

  const subtotal = b.subtotal ?? (parseFloat(b.baseRent || b.base_rent || 0) + parseFloat(elecCost) + parseFloat(waterCost) + parseFloat(internetCost) + parseFloat(sewageCost));
  const subtotalVal = document.getElementById('details-bill-subtotal-val');
  if (subtotalVal) subtotalVal.textContent = `₹${formatCurrencyAmount(subtotal)}`;

  const advance = b.advanceDeducted ?? b.advance_deducted ?? 0;
  const advVal = document.getElementById('details-bill-advance-val');
  if (advVal) advVal.textContent = `– ₹${formatCurrencyAmount(advance)}`;

  const netPayable = b.netPayable ?? b.net_payable ?? subtotal;
  const netVal = document.getElementById('details-bill-net-val');
  if (netVal) netVal.textContent = `₹${formatCurrencyAmount(netPayable)}`;

  const notesText = document.getElementById('details-bill-notes-text');
  if (notesText) notesText.textContent = b.notes || 'None';
}

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

  const openStartDatePicker = () => {
    try { startNative?.showPicker(); } catch (e) { startNative?.focus(); }
  };
  startTrigger?.addEventListener('click', openStartDatePicker);
  startDisplay?.addEventListener('click', openStartDatePicker);

  startNative?.addEventListener('change', (e) => {
    if (e.target.value && startDisplay) {
      const d = new Date(e.target.value + 'T00:00:00');
      startDisplay.value = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  });

  const openEndDatePicker = () => {
    try { endNative?.showPicker(); } catch (e) { endNative?.focus(); }
  };
  endTrigger?.addEventListener('click', openEndDatePicker);
  endDisplay?.addEventListener('click', openEndDatePicker);

  endNative?.addEventListener('change', (e) => {
    if (e.target.value && endDisplay) {
      const d = new Date(e.target.value + 'T00:00:00');
      endDisplay.value = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  });

  btnGenBillBack?.addEventListener('click', () => {
    if (state.previousScreen === 10 && currentActiveTenancy) {
      navigateToScreen(10);
    } else {
      navigateToScreen(6);
    }
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
    const elecUtil = target.tenancy_utilities?.find((u) => u.utility_type === 'electricity');
    const elecPricePerUnit = (elecUtil && elecUtil.price_per_unit > 0) ? elecUtil.price_per_unit : 12;
    const elecTotal = units * elecPricePerUnit;

    const prevWater = parseFloat(document.getElementById('input-prev-water')?.value) || 0;
    const currWater = parseFloat(document.getElementById('input-curr-water')?.value) || 0;
    const waterUnits = Math.max(0, currWater - prevWater);
    const waterUtil = target.tenancy_utilities?.find((u) => u.utility_type === 'water');
    const waterPricePerUnit = (waterUtil && waterUtil.price_per_unit > 0) ? waterUtil.price_per_unit : 10;
    const waterTotal = waterUnits > 0 ? waterUnits * waterPricePerUnit : (waterUtil?.flat_amount || 0);

    const rent = parseFloat(target.base_rent || 0);

    // Calculate Internet & Garbage / Waste utilities
    const internetUtil = target.tenancy_utilities?.find((u) => u.utility_type === 'internet');
    const internetTotal = (internetUtil && internetUtil.is_enabled !== false) ? (parseFloat(internetUtil.flat_amount) || 0) : 0;

    const garbageUtil = target.tenancy_utilities?.find((u) => u.utility_type === 'garbage');
    const sewageUtil = target.tenancy_utilities?.find((u) => u.utility_type === 'sewage');
    const garbageTotal = (garbageUtil && garbageUtil.is_enabled !== false) ? (parseFloat(garbageUtil.flat_amount) || 0) : (
      (sewageUtil && sewageUtil.is_enabled !== false) ? (parseFloat(sewageUtil.flat_amount) || 0) : 0
    );

    const otherUtilities = internetTotal + garbageTotal;
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
      internetCost: internetTotal,
      sewageCost: garbageTotal,
      otherUtilitiesCost: otherUtilities,
      subtotal: subtotal,
      advanceDeducted: advance,
      dueCarried: due,
      netPayable: netPayable,
      notes: notesVal,
      currElectricityReading: currElec,
      currWaterReading: currWater,
    };

    // Populate Screen 14 Review Bill (Corrected element IDs)
    const propTitleEl = document.getElementById('review-prop-title');
    if (propTitleEl) propTitleEl.textContent = target.property_name;

    const periodEl = document.getElementById('review-duration-text');
    if (periodEl) periodEl.textContent = `${startDate} – ${endDate}`;

    const genDateEl = document.getElementById('review-generated-date');
    if (genDateEl) genDateEl.textContent = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

    const rentEl = document.getElementById('review-rent-val');
    if (rentEl) rentEl.textContent = `₹${rent.toLocaleString('en-IN')}`;

    const elecSub = document.getElementById('review-elec-sub');
    if (elecSub) elecSub.textContent = `${currElec} - ${prevElec} = ${units} units @ ₹${elecPricePerUnit}/unit`;
    const elecVal = document.getElementById('review-elec-val');
    if (elecVal) elecVal.textContent = `₹${elecTotal.toLocaleString('en-IN')}`;

    const waterVal = document.getElementById('review-water-val');
    if (waterVal) waterVal.textContent = `₹${waterTotal.toLocaleString('en-IN')}`;

    const internetEl = document.getElementById('review-internet-val');
    if (internetEl) internetEl.textContent = `₹${internetTotal.toLocaleString('en-IN')}`;

    const sewageEl = document.getElementById('review-sewage-val');
    if (sewageEl) sewageEl.textContent = `₹${garbageTotal.toLocaleString('en-IN')}`;

    const subtotalVal = document.getElementById('review-subtotal-val');
    if (subtotalVal) subtotalVal.textContent = `₹${subtotal.toLocaleString('en-IN')}`;

    const advVal = document.getElementById('review-advance-val');
    if (advVal) advVal.textContent = `– ₹${advance.toLocaleString('en-IN')}`;

    const netVal = document.getElementById('review-net-val');
    if (netVal) netVal.textContent = `₹${netPayable.toLocaleString('en-IN')}`;

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

      // Advance meter readings for the tenancy in Supabase & memory
      try {
        if (activeBillDraft.currElectricityReading > 0) {
          await supabase
            .from('tenancy_utilities')
            .update({ last_meter_reading: activeBillDraft.currElectricityReading })
            .eq('tenancy_id', activeBillDraft.tenancyId)
            .eq('utility_type', 'electricity');

          const el = currentActiveTenancy?.tenancy_utilities?.find(u => u.utility_type === 'electricity');
          if (el) el.last_meter_reading = activeBillDraft.currElectricityReading;
        }
        if (activeBillDraft.currWaterReading > 0) {
          await supabase
            .from('tenancy_utilities')
            .update({ last_meter_reading: activeBillDraft.currWaterReading })
            .eq('tenancy_id', activeBillDraft.tenancyId)
            .eq('utility_type', 'water');

          const wa = currentActiveTenancy?.tenancy_utilities?.find(u => u.utility_type === 'water');
          if (wa) wa.last_meter_reading = activeBillDraft.currWaterReading;
        }
      } catch (meterErr) {
        console.warn('Advance meter reading notice:', meterErr);
      }

      // Populate Screen 15 Bill Details
      renderBillDetails({
        ...activeBillDraft,
        invoiceNumber: invoiceNumber,
      });

      await syncDashboardFromCloud();

      showToast(`✅ Bill of ₹${activeBillDraft.netPayable.toLocaleString('en-IN')} generated & saved to Supabase!`, 3500);

      navigateToScreen(15);
    } catch (e) {
      showToast(`❌ Error creating bill: ${e.message}`, 4000);
    } finally {
      btnConfirmGenBill.disabled = false;
      btnConfirmGenBill.textContent = 'Confirm & Generate Bill';
    }
  });

  btnBillDetailsBack?.addEventListener('click', () => {
    if (state.previousScreen === 18 && activeArchivedTenancy) {
      navigateToScreen(18);
    } else if (state.previousScreen === 10 && currentActiveTenancy) {
      navigateToScreen(10);
    } else {
      navigateToScreen(6);
    }
  });

  const handleShareInvoice = () => {
    const pName = activeBillDraft?.propertyName || activeBillDraft?.property_name || 'Home';
    const sDate = activeBillDraft?.durationStart || activeBillDraft?.duration_start || '';
    const eDate = activeBillDraft?.durationEnd || activeBillDraft?.duration_end || '';
    const net = activeBillDraft?.netPayable ?? activeBillDraft?.net_payable ?? 0;
    const rent = activeBillDraft?.baseRent ?? activeBillDraft?.base_rent ?? 0;
    const elec = activeBillDraft?.electricityCost ?? activeBillDraft?.electricity_cost ?? 0;
    const water = activeBillDraft?.waterCost ?? activeBillDraft?.water_cost ?? 0;
    const internet = activeBillDraft?.internetCost ?? 0;
    const waste = activeBillDraft?.sewageCost ?? activeBillDraft?.otherUtilitiesCost ?? 0;

    let extraLines = '';
    if (internet > 0) extraLines += `\n• Internet: ₹${parseFloat(internet).toLocaleString('en-IN')}`;
    if (waste > 0) extraLines += `\n• Waste/Other: ₹${parseFloat(waste).toLocaleString('en-IN')}`;

    const summaryText = `🏠 *RENTAL BUDDY INVOICE*\nProperty: *${pName}*\nPeriod: ${sDate} to ${eDate}\n--------------------------\n• Base Rent: ₹${parseFloat(rent).toLocaleString('en-IN')}\n• Electricity: ₹${parseFloat(elec).toLocaleString('en-IN')}\n• Water: ₹${parseFloat(water).toLocaleString('en-IN')}${extraLines}\n--------------------------\n*Total Net Payable: ₹${parseFloat(net).toLocaleString('en-IN')}*\nStatus: Unpaid\n\nGenerated via Rental Buddy`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(summaryText).catch(() => {});
    }
    const rawPhone = currentActiveTenancy?.tenant_phone || '';
    const phoneFormatted = formatWhatsAppPhone(rawPhone);
    const phoneParam = phoneFormatted ? `phone=${phoneFormatted}&` : '';
    const waUrl = `https://api.whatsapp.com/send?${phoneParam}text=${encodeURIComponent(summaryText)}`;
    window.open(waUrl, '_blank');
    showToast('📱 Invoice copied & opening WhatsApp...', 3500);
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

  // Danger Zone: Delete Account & Cloud Data
  const itemDeleteAccount = document.getElementById('item-delete-account');
  const modalDeleteAccount = document.getElementById('modal-delete-account');
  const btnCloseDeleteModal = document.getElementById('btnCloseDeleteModal');
  const btnCancelDeleteAccount = document.getElementById('btnCancelDeleteAccount');
  const btnConfirmDeleteAccount = document.getElementById('btnConfirmDeleteAccount');

  itemDeleteAccount?.addEventListener('click', () => {
    modalDeleteAccount?.classList.remove('hidden');
  });

  const closeDeleteModal = () => {
    modalDeleteAccount?.classList.add('hidden');
  };

  btnCloseDeleteModal?.addEventListener('click', closeDeleteModal);
  btnCancelDeleteAccount?.addEventListener('click', closeDeleteModal);

  btnConfirmDeleteAccount?.addEventListener('click', async () => {
    btnConfirmDeleteAccount.disabled = true;
    btnConfirmDeleteAccount.textContent = 'Deleting Everything...';
    try {
      await deleteUserAccountAndData();
      modalDeleteAccount?.classList.add('hidden');
      updateAuthUI(null);
      localStorage.clear();
      sessionStorage.clear();

      // Reset auth inputs and set screen 20 to Create Account mode
      const inputEmail = document.getElementById('auth-email-input');
      const inputPassword = document.getElementById('auth-password-input');
      const inputName = document.getElementById('auth-name-input');
      if (inputEmail) inputEmail.value = '';
      if (inputPassword) inputPassword.value = '';
      if (inputName) inputName.value = '';
      setAuthMode(true);

      showToast('🗑️ Account and all cloud data permanently deleted from Supabase. Next time, create a new account to register.', 5000);
      setTimeout(() => {
        navigateToScreen(20);
      }, 600);
    } catch (err) {
      showToast(`❌ Failed to delete account: ${err.message}`, 4500);
    } finally {
      btnConfirmDeleteAccount.disabled = false;
      btnConfirmDeleteAccount.textContent = 'Delete Everything';
    }
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
            <span class="tenancy-meta-sub">₹${parseFloat(t.base_rent || 0).toLocaleString('en-IN')} • Monthly</span>
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
  const totalAmount = document.getElementById('archdetails-total-amount');
  const lastBill = document.getElementById('archdetails-last-bill');
  const nextBill = document.getElementById('archdetails-next-bill');

  if (propTitle) propTitle.textContent = tenancy.property_name;
  if (rentRate) rentRate.textContent = `₹${parseFloat(tenancy.base_rent || 0).toLocaleString('en-IN')} • Monthly`;

  try {
    const bills = await fetchCloudBills(tenancy.id);
    if (bills && bills.length > 0) {
      const total = bills.reduce((acc, b) => acc + parseFloat(b.net_payable || 0), 0);
      if (totalAmount) totalAmount.textContent = `₹${formatCurrencyAmount(total)}`;
      if (lastBill) lastBill.textContent = `₹${parseFloat(bills[0].net_payable).toLocaleString('en-IN')}`;
    } else {
      if (totalAmount) totalAmount.textContent = '₹0';
      if (lastBill) lastBill.textContent = '₹0';
    }
    if (nextBill) nextBill.textContent = 'Archived';

    const historyList = document.getElementById('archdetails-history-list');
    if (historyList) {
      if (bills && bills.length > 0) {
        historyList.innerHTML = '';
        bills.forEach((b) => {
          const row = document.createElement('div');
          row.className = 'recent-item-card';
          row.setAttribute('role', 'button');
          row.setAttribute('tabindex', '0');
          row.style.cursor = 'pointer';
          row.innerHTML = `
            <div class="recent-item-left">
              <strong class="recent-item-title">${b.duration_start} – ${b.duration_end}</strong>
              <span class="recent-item-timestamp">Generated on ${b.generated_date} • ${b.status}</span>
            </div>
            <div class="recent-item-right">
              <strong class="recent-item-amount">₹${parseFloat(b.net_payable).toLocaleString('en-IN')}</strong>
              <svg class="recent-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
          `;
          row.addEventListener('click', () => {
            renderBillDetails({
              ...b,
              propertyName: tenancy.property_name,
            });
            navigateToScreen(15);
          });
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
        currencySymbol: '₹',
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
    reader.onload = async (event) => {
      try {
        const content = event.target?.result;
        const parsed = JSON.parse(content);

        if (parsed.format === 'rhb' || parsed.app === 'Rental Buddy' || parsed.tenancies) {
          showToast(`📦 Restoring records from ${file.name}...`, 3000);
          if (Array.isArray(parsed.tenancies) && parsed.tenancies.length > 0 && cloudSession.user) {
            for (const t of parsed.tenancies) {
              const alreadyExists = cloudTenanciesList.some(ct => ct.property_name.toLowerCase() === (t.property_name || '').toLowerCase());
              if (!alreadyExists && t.property_name) {
                try {
                  await createCloudTenancy({
                    propertyName: t.property_name,
                    tenantName: t.tenant_name || 'Tenant',
                    tenantPhone: t.tenant_phone || '',
                    baseRent: t.base_rent || 0,
                    advanceAmount: t.advance_amount || 0,
                    billingDay: t.billing_day || 1,
                    utilities: t.tenancy_utilities || [],
                  });
                } catch (createErr) {
                  console.warn('Restore tenancy notice:', createErr);
                }
              }
            }
            await syncDashboardFromCloud();
          }
          showToast(`✅ Successfully restored backup from ${file.name}!`, 3500);
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

  const authNav = document.getElementById('auth-nav-header');
  const btnAuthBack = document.getElementById('btn-auth-back');

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
    authNav?.classList.add('hidden');
    btnAuthBack?.classList.add('hidden');
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
  authNav?.classList.remove('hidden');
  btnAuthBack?.classList.remove('hidden');
}

export let isAuthSignUpMode = false;

export function setAuthMode(isSignUp) {
  isAuthSignUpMode = isSignUp;
  const nameGroup = document.getElementById('auth-name-group');
  const formTitle = document.getElementById('auth-form-title');
  const btnSubmit = document.getElementById('btn-submit-auth');
  const switchText = document.getElementById('auth-switch-text');
  const btnToggleMode = document.getElementById('btn-toggle-auth-mode');
  const formAuth = document.getElementById('auth-login-form');
  const confirmBox = document.getElementById('auth-confirm-box');
  const authToggle = document.getElementById('auth-toggle-container');

  confirmBox?.classList.add('hidden');
  formAuth?.classList.remove('hidden');
  authToggle?.classList.remove('hidden');

  if (nameGroup) nameGroup.classList.toggle('hidden', !isSignUp);
  if (formTitle) formTitle.textContent = isSignUp ? 'Create Your Admin Account' : 'Sign In to Your Account';
  if (btnSubmit) btnSubmit.textContent = isSignUp ? 'Create Account with Supabase' : 'Sign In with Supabase';
  if (switchText) switchText.textContent = isSignUp ? 'Already have an account?' : 'Don’t have an account?';
  if (btnToggleMode) btnToggleMode.textContent = isSignUp ? 'Sign In' : 'Create Account';
}

export function userHasExistingData(userId) {
  const hasTenancies = Array.isArray(cloudTenanciesList) && cloudTenanciesList.length > 0;
  const hasBills = Array.isArray(cloudBillsList) && cloudBillsList.length > 0;
  const hasPayments = Array.isArray(cloudPaymentsList) && cloudPaymentsList.length > 0;
  const isMarkedCompleted = Boolean(
    cloudSession.profile?.onboarding_completed ||
    (userId && localStorage.getItem(`rb_onboarding_completed_${userId}`) === 'true')
  );
  return hasTenancies || hasBills || hasPayments || isMarkedCompleted;
}

function initAuthScreen() {
  const btnAuthBack = document.getElementById('btn-auth-back');
  const inputEmail = document.getElementById('auth-email-input');
  const inputPassword = document.getElementById('auth-password-input');
  const inputName = document.getElementById('auth-name-input');
  const btnToggleEye = document.getElementById('btn-toggle-password-visibility');
  const formAuth = document.getElementById('auth-login-form');
  const btnForgot = document.getElementById('btn-forgot-password');
  const btnToggleMode = document.getElementById('btn-toggle-auth-mode');
  const btnSubmit = document.getElementById('btn-submit-auth');

  btnAuthBack?.addEventListener('click', () => {
    navigateToScreen(6);
  });

  btnToggleEye?.addEventListener('click', () => {
    if (inputPassword) {
      const isPass = inputPassword.type === 'password';
      inputPassword.type = isPass ? 'text' : 'password';
      btnToggleEye.style.color = isPass ? '#5452EC' : '#7D849B';
    }
  });

  btnToggleMode?.addEventListener('click', () => {
    setAuthMode(!isAuthSignUpMode);
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
      btnSubmit.textContent = isAuthSignUpMode ? 'Registering Admin Account...' : 'Signing In...';
    }

    try {
      let authResult;
      if (isAuthSignUpMode) {
        authResult = await signUpUser(email, password, fullName);
        if (!authResult || !authResult.success) {
          showToast(`❌ ${authResult?.error || 'Account creation failed.'}`, 4500);
          return;
        }

        // Check if email confirmation is required (standard Supabase Auth configuration)
        if (authResult.needsEmailConfirmation) {
          formAuth?.classList.add('hidden');
          const authToggle = document.getElementById('auth-toggle-container');
          authToggle?.classList.add('hidden');
          const confirmBox = document.getElementById('auth-confirm-box');
          const emailDisplay = document.getElementById('auth-confirm-email-display');
          if (emailDisplay) emailDisplay.textContent = email;
          confirmBox?.classList.remove('hidden');
          showToast('📧 Verification email sent! Please confirm your email before signing in.', 5000);
          return;
        }
      } else {
        authResult = await signInUser(email, password);
        if (!authResult || !authResult.success) {
          showToast(`❌ ${authResult?.error || 'Authentication failed. Please check credentials.'}`, 4500);
          return;
        }
      }

      updateAuthUI(authResult.user);
      const actionWord = isAuthSignUpMode ? 'Admin account created & registered in Supabase Cloud' : 'Signed in successfully';
      showToast(`⚡ ${actionWord}!`, 3500);

      // Check whether user has existing data or completed onboarding
      const user = authResult.user;
      await syncDashboardFromCloud();

      const hasData = userHasExistingData(user.id);
      if (hasData) {
        localStorage.setItem(`rb_onboarding_completed_${user.id}`, 'true');
        try {
          updateUserProfile({ onboarding_completed: true });
        } catch (e) {
          // ignore
        }
      }

      setTimeout(() => {
        if (!hasData) {
          window.rbFirstTimeOnboarding = true;
          navigateToScreen(2); // Start functional onboarding ONLY for brand-new users with zero data
        } else {
          navigateToScreen(6); // Existing user with data always goes straight to Dashboard
        }
      }, 500);
    } catch (err) {
      showToast(`❌ Auth error: ${err.message}`, 4000);
    } finally {
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.textContent = isAuthSignUpMode ? 'Create Account with Supabase' : 'Sign In with Supabase';
      }
    }
  });

  // Confirmatory screen listeners
  const btnConfirmToSignIn = document.getElementById('btn-confirm-to-signin');
  const btnResendVerification = document.getElementById('btn-resend-verification');

  btnConfirmToSignIn?.addEventListener('click', () => {
    setAuthMode(false);
    if (inputPassword) inputPassword.value = '';
    inputPassword?.focus();
  });

  btnResendVerification?.addEventListener('click', async () => {
    const email = document.getElementById('auth-confirm-email-display')?.textContent?.trim() || inputEmail?.value?.trim();
    if (!email) return;
    btnResendVerification.disabled = true;
    btnResendVerification.textContent = 'Resending...';
    try {
      const res = await resendVerificationEmail(email);
      if (res.success) {
        showToast('📨 Verification email resent! Please check your inbox and spam folder.', 4500);
      } else {
        showToast(`❌ ${res.error || 'Failed to resend'}`);
      }
    } catch (e) {
      showToast(`❌ ${e.message}`);
    } finally {
      btnResendVerification.disabled = false;
      btnResendVerification.textContent = "Didn't receive it? Resend Email";
    }
  });
}

// ==========================================================================
// DEDICATED FAMILY SHARING PAGE CONTROLLER (SCREEN 22)
// ==========================================================================

let activeFamilyTab = 'shared-with-me'; // 'shared-with-me' | 'sharing'

export async function refreshFamilySharingPage() {
  if (!cloudSession.user) return;

  const badgeSharedWithMe = document.getElementById('badge-shared-with-me-count');
  const badgeSharing = document.getElementById('badge-sharing-count');
  const stackIncomingPending = document.getElementById('stack-incoming-pending');
  const stackIncomingActive = document.getElementById('stack-incoming-active');
  const stackOutgoing = document.getElementById('stack-outgoing-shares');
  const groupIncomingPending = document.getElementById('group-incoming-pending');
  const groupIncomingActive = document.getElementById('group-incoming-active');
  const labelPendingCount = document.getElementById('label-pending-count');
  const labelActiveSharesCount = document.getElementById('label-active-shares-count');
  const emptySharedWithMe = document.getElementById('empty-shared-with-me');
  const emptySharing = document.getElementById('empty-sharing');

  try {
    // 1. Fetch live incoming & outgoing shares
    const [incoming, outgoing] = await Promise.all([
      fetchIncomingFamilyShares(),
      fetchOutgoingFamilyShares(),
    ]);
    cloudIncomingSharesList = incoming || [];
    cloudOutgoingSharesList = outgoing || [];

    // 2. Update Tab Count Badges
    const pendingIncoming = cloudIncomingSharesList.filter((s) => s.status === 'pending');
    const activeIncoming = cloudIncomingSharesList.filter((s) => s.status === 'approved' || s.status === 'accepted');

    if (badgeSharedWithMe) {
      badgeSharedWithMe.textContent = (pendingIncoming.length + activeIncoming.length).toString();
    }
    if (badgeSharing) {
      badgeSharing.textContent = cloudOutgoingSharesList.length.toString();
    }

    if (labelPendingCount) {
      labelPendingCount.textContent = `${pendingIncoming.length} Pending`;
    }
    if (labelActiveSharesCount) {
      labelActiveSharesCount.textContent = `${activeIncoming.length} Active`;
    }

    // 3. Render VIEW 1: Shared with Me
    if (cloudIncomingSharesList.length === 0) {
      emptySharedWithMe?.classList.remove('hidden');
      if (groupIncomingPending) groupIncomingPending.style.display = 'none';
      if (groupIncomingActive) groupIncomingActive.style.display = 'none';
    } else {
      emptySharedWithMe?.classList.add('hidden');

      // Pending requests
      if (groupIncomingPending) {
        groupIncomingPending.style.display = pendingIncoming.length > 0 ? '' : 'none';
      }
      if (stackIncomingPending) {
        stackIncomingPending.innerHTML = '';
        pendingIncoming.forEach((share) => {
          const card = document.createElement('div');
          card.className = 'family-request-card';
          const isManager = share.role === 'manager';
          const roleBadge = isManager
            ? '<span class="family-role-badge manager">🛠️ Manager</span>'
            : '<span class="family-role-badge viewer">👁️ Viewer (Read Only)</span>';

          const ownerName = share.admin_name || (share.admin_email ? share.admin_email.split('@')[0] : 'Owner');
          const ownerEmail = share.admin_email || '';
          const avatarInitial = (ownerName.charAt(0) || '👤').toUpperCase();

          // Resolve tenancy names
          let tenancyNames = [];
          if (share.tenancy_names && Array.isArray(share.tenancy_names) && share.tenancy_names.length > 0) {
            tenancyNames = share.tenancy_names;
          } else {
            const matched = (cloudTenanciesList || []).filter(
              (t) => t.owner_id === share.admin_id || (share.tenancy_ids && share.tenancy_ids.includes(t.id))
            );
            tenancyNames = matched.map((t) => t.property_name);
          }
          if (tenancyNames.length === 0) {
            tenancyNames = ['Selected Properties'];
          }

          const propChipsHtml = tenancyNames
            .map((name) => `<span class="family-prop-chip">🏡 ${name}</span>`)
            .join('');

          card.innerHTML = `
            <div class="family-card-top-row">
              <div class="family-card-user-info">
                <div class="family-avatar">${avatarInitial}</div>
                <div class="family-user-texts">
                  <span class="family-user-sub">Invited by Property Owner</span>
                  <strong class="family-user-email">${ownerName}</strong>
                  ${ownerEmail ? `<span class="family-user-sub" style="font-size: 11px;">${ownerEmail}</span>` : ''}
                </div>
              </div>
              ${roleBadge}
            </div>

            <div class="family-properties-box">
              <span class="family-prop-heading">Requested Tenancies</span>
              <div class="family-prop-chips-wrap">
                ${propChipsHtml}
              </div>
            </div>

            <div style="font-size: 12px; color: #7D849B; display: flex; align-items: center; gap: 6px;">
              <span>⏳</span>
              <span>Awaiting your decision before syncing to your database</span>
            </div>

            <div class="family-card-actions-row">
              <button type="button" class="btn-share-approve" data-share-id="${share.id}">
                ✔ Approve & Sync
              </button>
              <button type="button" class="btn-share-deny" data-share-id="${share.id}">
                ✕ Deny
              </button>
            </div>
          `;

          // Approve Handler
          card.querySelector('.btn-share-approve')?.addEventListener('click', async (e) => {
            const btn = e.currentTarget;
            btn.disabled = true;
            btn.textContent = 'Syncing...';
            try {
              await respondToFamilyShare(share.id, true);
              showToast('✅ Approved! Syncing shared tenancies to your dashboard...', 3500);
              await syncDashboardFromCloud();
              await refreshFamilySharingPage();
            } catch (err) {
              showToast(`❌ Approval error: ${err.message}`);
              btn.disabled = false;
              btn.textContent = '✔ Approve & Sync';
            }
          });

          // Deny Handler
          card.querySelector('.btn-share-deny')?.addEventListener('click', async (e) => {
            const btn = e.currentTarget;
            btn.disabled = true;
            btn.textContent = 'Denying...';
            try {
              await respondToFamilyShare(share.id, false);
              showToast('🚫 Share request denied.');
              await syncDashboardFromCloud();
              await refreshFamilySharingPage();
            } catch (err) {
              showToast(`❌ Deny error: ${err.message}`);
              btn.disabled = false;
              btn.textContent = '✕ Deny';
            }
          });

          stackIncomingPending.appendChild(card);
        });
      }

      // Active accepted requests
      if (groupIncomingActive) {
        groupIncomingActive.style.display = activeIncoming.length > 0 ? '' : 'none';
      }
      if (stackIncomingActive) {
        stackIncomingActive.innerHTML = '';
        activeIncoming.forEach((share) => {
          const card = document.createElement('div');
          card.className = 'family-request-card active-share-card';
          const isManager = share.role === 'manager';
          const roleBadge = isManager
            ? '<span class="family-role-badge manager">🛠️ Manager</span>'
            : '<span class="family-role-badge viewer">👁️ Viewer (Read Only)</span>';

          const ownerName = share.admin_name || (share.admin_email ? share.admin_email.split('@')[0] : 'Owner');
          const ownerEmail = share.admin_email || '';
          const avatarInitial = (ownerName.charAt(0) || '👤').toUpperCase();

          // Resolve tenancy names
          let tenancyNames = [];
          if (share.tenancy_names && Array.isArray(share.tenancy_names) && share.tenancy_names.length > 0) {
            tenancyNames = share.tenancy_names;
          } else {
            const matched = (cloudTenanciesList || []).filter(
              (t) => t.owner_id === share.admin_id || (share.tenancy_ids && share.tenancy_ids.includes(t.id))
            );
            tenancyNames = matched.map((t) => t.property_name);
          }
          if (tenancyNames.length === 0) {
            tenancyNames = ['All Properties'];
          }

          const propChipsHtml = tenancyNames
            .map((name) => `<span class="family-prop-chip">🏡 ${name}</span>`)
            .join('');

          card.innerHTML = `
            <div class="family-card-top-row">
              <div class="family-card-user-info">
                <div class="family-avatar">${avatarInitial}</div>
                <div class="family-user-texts">
                  <span class="family-user-sub">Shared by Owner</span>
                  <strong class="family-user-email">${ownerName}</strong>
                  ${ownerEmail ? `<span class="family-user-sub" style="font-size: 11px;">${ownerEmail}</span>` : ''}
                </div>
              </div>
              ${roleBadge}
            </div>

            <div class="family-properties-box">
              <span class="family-prop-heading">Shared Tenancy</span>
              <div class="family-prop-chips-wrap">
                ${propChipsHtml}
              </div>
            </div>

            <div class="active-sync-badge">
              <span class="sync-dot"></span>
              <span>Live Synced to Your Dashboard</span>
            </div>

            <div class="family-card-actions-row" style="margin-top: 6px;">
              <button type="button" class="btn-share-leave" data-share-id="${share.id}">
                Leave Shared Access
              </button>
            </div>
          `;

          card.querySelector('.btn-share-leave')?.addEventListener('click', async (e) => {
            const btn = e.currentTarget;
            const targetLabel = share.admin_name || share.admin_email || 'this owner';
            if (!confirm(`Are you sure you want to stop viewing properties shared by ${targetLabel}?`)) return;
            if (btn) {
              btn.disabled = true;
              btn.textContent = 'Leaving...';
            }
            try {
              await leaveFamilyShare(share.id);
              showToast('Removed shared access.');
              await syncDashboardFromCloud();
              await refreshFamilySharingPage();
            } catch (err) {
              showToast(`❌ Error: ${err.message}`);
              if (btn) {
                btn.disabled = false;
                btn.textContent = 'Leave Shared Access';
              }
            }
          });

          stackIncomingActive.appendChild(card);
        });
      }
    }

    // 4. Render VIEW 2: Sharing (Outgoing Shares)
    if (cloudOutgoingSharesList.length === 0) {
      emptySharing?.classList.remove('hidden');
      if (stackOutgoing) stackOutgoing.innerHTML = '';
    } else {
      emptySharing?.classList.add('hidden');
      if (stackOutgoing) {
        stackOutgoing.innerHTML = '';
        cloudOutgoingSharesList.forEach((share) => {
          const card = document.createElement('div');
          card.className = 'family-request-card outgoing-share-card';

          let statusBadge = '';
          if (share.status === 'pending') {
            statusBadge = '<span class="family-status-pill pending">⏳ Pending Approval</span>';
          } else if (share.status === 'approved' || share.status === 'accepted') {
            statusBadge = '<span class="family-status-pill approved">✔ Approved & Synced</span>';
          } else if (share.status === 'denied') {
            statusBadge = '<span class="family-status-pill denied">🚫 Denied by Recipient</span>';
          } else {
            statusBadge = `<span class="family-status-pill pending">${share.status}</span>`;
          }

          const isManager = share.role === 'manager';
          const roleBadge = isManager
            ? '<button type="button" class="family-role-badge manager role-badge-clickable" title="Click to toggle between Manager and Viewer" style="cursor: pointer; border: 1px solid #DDD6FE;">🛠️ Manager ▾</button>'
            : '<button type="button" class="family-role-badge viewer role-badge-clickable" title="Click to toggle between Manager and Viewer" style="cursor: pointer; border: 1px solid #BAE6FD;">👁️ Viewer ▾</button>';

          const recipientEmail = share.member_email || 'Recipient';
          const avatarInitial = (recipientEmail.charAt(0) || '✉️').toUpperCase();

          // Resolve tenancy names
          let tenancyNames = [];
          if (share.tenancy_names && Array.isArray(share.tenancy_names) && share.tenancy_names.length > 0) {
            tenancyNames = share.tenancy_names;
          } else if (share.tenancy_ids && Array.isArray(share.tenancy_ids) && share.tenancy_ids.length > 0) {
            tenancyNames = share.tenancy_ids.map((tid) => {
              const found = (cloudTenanciesList || []).find((t) => t.id === tid);
              return found ? found.property_name : 'Selected Property';
            });
          } else {
            tenancyNames = ['All Properties'];
          }

          const propChipsHtml = tenancyNames
            .map((name) => `<span class="family-prop-chip">🏡 ${name}</span>`)
            .join('');

          card.innerHTML = `
            <div class="family-card-top-row">
              <div class="family-card-user-info">
                <div class="family-avatar">${avatarInitial}</div>
                <div class="family-user-texts">
                  <span class="family-user-sub">Recipient</span>
                  <strong class="family-user-email">${recipientEmail}</strong>
                </div>
              </div>
              <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
                ${roleBadge}
                ${statusBadge}
              </div>
            </div>

            <div class="family-properties-box">
              <span class="family-prop-heading">Shared Tenancies</span>
              <div class="family-prop-chips-wrap">
                ${propChipsHtml}
              </div>
            </div>

            <!-- Access Permission Switcher: Change between Manager & Viewer without revoking -->
            <div class="share-role-switch-row">
              <div class="role-switch-left">
                <span class="role-switch-title">Access Permission</span>
                <span class="role-switch-sub">${isManager ? 'Manager (Record payments & bills)' : 'Viewer (Strictly read-only access)'}</span>
              </div>
              <div class="role-segmented-switcher" role="radiogroup" aria-label="Switch access permission">
                <button type="button" class="role-segment-btn manager ${isManager ? 'active' : ''}" data-target-role="manager" title="Switch to Manager">
                  🛠️ Manager
                </button>
                <button type="button" class="role-segment-btn viewer ${!isManager ? 'active' : ''}" data-target-role="viewer" title="Switch to Viewer">
                  👁️ Viewer
                </button>
              </div>
            </div>

            <div class="family-card-actions-row" style="margin-top: 4px; justify-content: flex-end;">
              <button type="button" class="btn-share-revoke" data-share-id="${share.id}">
                🗑️ Revoke Access
              </button>
            </div>
          `;

          // Role Switcher Click Handlers (Manager vs Viewer)
          card.querySelectorAll('.role-segment-btn').forEach((btn) => {
            btn.addEventListener('click', async (e) => {
              const targetRole = e.currentTarget.dataset.targetRole;
              if (targetRole === share.role) return;

              const allBtns = card.querySelectorAll('.role-segment-btn');
              allBtns.forEach((b) => (b.disabled = true));
              const prevText = e.currentTarget.textContent;
              e.currentTarget.textContent = 'Updating...';

              try {
                await updateFamilyShareRole(share.id, targetRole);
                share.role = targetRole;
                showToast(`Access updated to ${targetRole === 'manager' ? '🛠️ Manager' : '👁️ Viewer'}`);
                await refreshFamilySharingPage();
              } catch (err) {
                showToast(`❌ Failed to update role: ${err.message}`);
                allBtns.forEach((b) => (b.disabled = false));
                e.currentTarget.textContent = prevText;
              }
            });
          });

          // Top role badge clickable shortcut
          card.querySelector('.role-badge-clickable')?.addEventListener('click', () => {
            const nextRole = share.role === 'manager' ? 'viewer' : 'manager';
            const targetBtn = card.querySelector(`.role-segment-btn[data-target-role="${nextRole}"]`);
            targetBtn?.click();
          });

          card.querySelector('.btn-share-revoke')?.addEventListener('click', async () => {
            if (!confirm(`Revoke shared property access for ${share.member_email}?`)) return;
            try {
              await revokeFamilyShare(share.id);
              showToast(`🗑️ Revoked sharing for ${share.member_email}`);
              await syncDashboardFromCloud();
              await refreshFamilySharingPage();
            } catch (err) {
              showToast(`❌ Error: ${err.message}`);
            }
          });

          stackOutgoing.appendChild(card);
        });
      }
    }
  } catch (err) {
    console.warn('refreshFamilySharingPage warning:', err);
  }
}

function initFamilySharingPage() {
  const btnBack = document.getElementById('btn-family-page-back');
  const btnTopAdd = document.getElementById('btn-top-add-share');
  const btnFooterAdd = document.getElementById('btn-footer-create-share');
  const btnOpenShareList = document.getElementById('btn-open-share-from-list');
  const btnEmptyShare = document.getElementById('btn-empty-start-share');
  const tabBtnSharedWithMe = document.getElementById('tab-btn-shared-with-me');
  const tabBtnSharing = document.getElementById('tab-btn-sharing');
  const viewSharedWithMe = document.getElementById('view-shared-with-me');
  const viewSharing = document.getElementById('view-sharing');

  const modalShare = document.getElementById('modal-selective-share');
  const btnCloseModal = document.getElementById('btn-close-selective-share');
  const formShare = document.getElementById('form-selective-share');
  const inputEmail = document.getElementById('input-share-member-email');
  const cardManager = document.getElementById('card-share-role-manager');
  const cardViewer = document.getElementById('card-share-role-viewer');
  const checklistTenancies = document.getElementById('checklist-share-tenancies');
  const btnToggleSelectAll = document.getElementById('btn-toggle-select-all-tenancies');
  const btnSubmitInvite = document.getElementById('btn-submit-share-invite');

  const incomingBanner = document.getElementById('incoming-shares-alert-banner');
  const itemFamilySharing = document.getElementById('item-family-sharing');
  const btnLogout = document.getElementById('btn-settings-logout');

  // Navigation handlers
  btnBack?.addEventListener('click', () => {
    navigateToScreen(6);
  });

  incomingBanner?.addEventListener('click', () => {
    switchFamilyTab('shared-with-me');
    navigateToScreen(22);
  });

  itemFamilySharing?.addEventListener('click', () => {
    navigateToScreen(22);
  });

  // Tab switching
  function switchFamilyTab(tab) {
    activeFamilyTab = tab;
    if (tab === 'shared-with-me') {
      tabBtnSharedWithMe?.classList.add('active');
      tabBtnSharing?.classList.remove('active');
      viewSharedWithMe?.classList.remove('hidden');
      viewSharing?.classList.add('hidden');
    } else {
      tabBtnSharing?.classList.add('active');
      tabBtnSharedWithMe?.classList.remove('active');
      viewSharing?.classList.remove('hidden');
      viewSharedWithMe?.classList.add('hidden');
    }
  }

  tabBtnSharedWithMe?.addEventListener('click', () => switchFamilyTab('shared-with-me'));
  tabBtnSharing?.addEventListener('click', () => switchFamilyTab('sharing'));

  // Role radio cards in modal
  cardManager?.addEventListener('click', () => {
    cardManager.classList.add('selected');
    cardViewer?.classList.remove('selected');
    const radio = cardManager.querySelector('input[type="radio"]');
    if (radio) radio.checked = true;
  });

  cardViewer?.addEventListener('click', () => {
    cardViewer.classList.add('selected');
    cardManager?.classList.remove('selected');
    const radio = cardViewer.querySelector('input[type="radio"]');
    if (radio) radio.checked = true;
  });

  // Open Modal & Populate Selective Tenancies
  function openSelectiveShareModal() {
    if (!cloudSession.user) {
      showToast('🔒 Please sign in first');
      return;
    }

    if (inputEmail) inputEmail.value = '';

    // Reset role to manager
    cardManager?.classList.add('selected');
    cardViewer?.classList.remove('selected');
    const radioMgr = cardManager?.querySelector('input[type="radio"]');
    if (radioMgr) radioMgr.checked = true;

    // Populate tenancies
    if (checklistTenancies) {
      checklistTenancies.innerHTML = '';
      // Only include tenancies owned by this user
      const ownedTenancies = (cloudTenanciesList || []).filter(
        (t) => t.owner_id === cloudSession.user.id
      );

      if (ownedTenancies.length === 0) {
        checklistTenancies.innerHTML = `
          <div style="padding: 10px 0; color: #7D849B; font-size: 13.5px; text-align: center;">
            No owned tenancies found to share. Create a tenancy first.
          </div>
        `;
      } else {
        ownedTenancies.forEach((t) => {
          const item = document.createElement('label');
          item.className = 'share-check-item selected';
          item.innerHTML = `
            <input type="checkbox" name="share-tenancy-select" value="${t.id}" checked />
            <div class="share-card-left">
              <div class="share-prop-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9.5z" />
                  <path d="M9 21V12h6v9" />
                </svg>
              </div>
              <div class="share-prop-info">
                <strong class="share-prop-name">${t.property_name}</strong>
                <span class="share-prop-rent">₹${parseFloat(t.base_rent || 0).toLocaleString('en-IN')} • Monthly</span>
              </div>
            </div>
            <div class="share-card-check">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          `;

          const cb = item.querySelector('input[type="checkbox"]');
          cb?.addEventListener('change', () => {
            item.classList.toggle('selected', cb.checked);
            updateSelectAllState();
          });

          checklistTenancies.appendChild(item);
        });
      }
    }

    modalShare?.classList.remove('hidden');
  }

  function updateSelectAllState() {
    if (!checklistTenancies || !btnToggleSelectAll) return;
    const checkboxes = checklistTenancies.querySelectorAll('input[type="checkbox"]');
    if (checkboxes.length === 0) return;
    const allChecked = Array.from(checkboxes).every((cb) => cb.checked);
    btnToggleSelectAll.textContent = allChecked ? 'Deselect All' : 'Select All';
  }

  btnTopAdd?.addEventListener('click', openSelectiveShareModal);
  btnFooterAdd?.addEventListener('click', openSelectiveShareModal);
  btnOpenShareList?.addEventListener('click', openSelectiveShareModal);
  btnEmptyShare?.addEventListener('click', openSelectiveShareModal);

  // Close modal
  btnCloseModal?.addEventListener('click', () => modalShare?.classList.add('hidden'));
  modalShare?.addEventListener('click', (e) => {
    if (e.target === modalShare) modalShare.classList.add('hidden');
  });

  // Select / Deselect all tenancies toggle
  btnToggleSelectAll?.addEventListener('click', () => {
    if (!checklistTenancies) return;
    const checkboxes = checklistTenancies.querySelectorAll('input[type="checkbox"]');
    const allChecked = Array.from(checkboxes).every((cb) => cb.checked);
    checkboxes.forEach((cb) => {
      cb.checked = !allChecked;
      const card = cb.closest('.share-check-item');
      if (card) card.classList.toggle('selected', !allChecked);
    });
    btnToggleSelectAll.textContent = allChecked ? 'Select All' : 'Deselect All';
  });

  // Submit Selective Share Form
  formShare?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = inputEmail?.value?.trim()?.toLowerCase();
    if (!email || !email.includes('@')) {
      showToast('⚠️ Please enter a valid recipient email address');
      return;
    }
    if (email === cloudSession.user.email?.toLowerCase()) {
      showToast('⚠️ You cannot share properties with your own email');
      return;
    }

    const selectedRoleInput = document.querySelector('input[name="selective-share-role"]:checked');
    const role = selectedRoleInput?.value === 'viewer' ? 'viewer' : 'manager';

    const selectedTenancyCheckboxes = checklistTenancies?.querySelectorAll('input[name="share-tenancy-select"]:checked');
    const selectedTenancyIds = Array.from(selectedTenancyCheckboxes || []).map((cb) => cb.value);
    const selectedTenancyNames = selectedTenancyIds.map((id) => {
      const match = (cloudTenanciesList || []).find((t) => t.id === id);
      return match ? match.property_name : 'Selected Tenancy';
    });

    if (selectedTenancyIds.length === 0) {
      showToast('⚠️ Please select at least one tenancy to share');
      return;
    }

    if (btnSubmitInvite) {
      btnSubmitInvite.disabled = true;
      btnSubmitInvite.textContent = 'Sending Invitation...';
    }

    try {
      await createSelectiveFamilyShare({
        email,
        role,
        tenancyIds: selectedTenancyIds,
        tenancyNames: selectedTenancyNames,
      });

      modalShare?.classList.add('hidden');
      showToast(`✉️ Share invitation sent to ${email}!`, 3500);

      // Refresh data and switch to Sharing tab
      await syncDashboardFromCloud();
      switchFamilyTab('sharing');
      await refreshFamilySharingPage();
    } catch (err) {
      showToast(`❌ Share error: ${err.message}`);
    } finally {
      if (btnSubmitInvite) {
        btnSubmitInvite.disabled = false;
        btnSubmitInvite.textContent = 'Send Share Invitation';
      }
    }
  });

  // Settings screen logout button
  btnLogout?.addEventListener('click', async () => {
    await signOutUser();
    cloudTenanciesList = [];
    cloudBillsList = [];
    cloudPaymentsList = [];
    cloudIncomingSharesList = [];
    cloudOutgoingSharesList = [];
    currentActiveTenancy = null;
    updateAuthUI(null);
    const wrapper = document.getElementById('tenancies-list-wrapper');
    if (wrapper) wrapper.innerHTML = '';
    const emptyState = document.getElementById('dashboard-empty-tenancies');
    emptyState?.classList.remove('hidden');
    showToast('🔒 Signed out of session');
    setTimeout(() => {
      navigateToScreen(20);
    }, 400);
  });
}

// ==========================================================================
// PAYMENT RECEIPT & MOVIE-TICKET VOUCHER (SCREEN 21)
// ==========================================================================

export let currentReceiptPayment = null;
export let currentReceiptTenancy = null;

export function openPaymentReceipt(payment, tenancy = null) {
  if (!payment) return;
  currentReceiptPayment = payment;

  // Fallback to resolve tenancy if not passed directly
  if (!tenancy && payment.tenancy_id) {
    tenancy = (cloudTenanciesList || []).find((t) => t.id === payment.tenancy_id);
  }
  currentReceiptTenancy = tenancy;

  const propTitle = document.getElementById('receipt-prop-title');
  const tenantText = document.getElementById('receipt-tenant-text');
  const rentText = document.getElementById('receipt-rent-text');
  const statusPill = document.getElementById('receipt-status-pill');
  const stampPill = document.getElementById('receipt-stamp-pill');
  const paymentDate = document.getElementById('receipt-payment-date');
  const billingCycle = document.getElementById('receipt-billing-cycle');
  const paymentMode = document.getElementById('receipt-payment-mode');
  const referenceNo = document.getElementById('receipt-reference-no');
  const iconCash = document.getElementById('receipt-icon-cash');
  const iconOnline = document.getElementById('receipt-icon-online');
  const totalAmount = document.getElementById('receipt-total-amount');
  const propAddress = document.getElementById('receipt-prop-address');
  const allocationsList = document.getElementById('receipt-allocations-list');
  const notesRow = document.getElementById('receipt-notes-row');
  const notesText = document.getElementById('receipt-notes-text');
  const orderId = document.getElementById('receipt-order-id');

  const pName = tenancy?.property_name || payment.tenancies?.property_name || 'Rental Property';
  if (propTitle) propTitle.textContent = pName;

  // Refined tenant presentation: avoid "Tenant: Tenant"
  if (tenantText) {
    if (tenancy?.tenant_name && tenancy.tenant_name.toLowerCase() !== 'tenant' && tenancy.tenant_name !== pName) {
      tenantText.textContent = tenancy.tenant_name;
    } else if (tenancy?.tenant_phone) {
      tenantText.textContent = tenancy.tenant_phone;
    } else {
      tenantText.textContent = 'Tenant';
    }
  }

  const rentVal = tenancy?.base_rent ? parseFloat(tenancy.base_rent) : 0;
  if (rentText) {
    rentText.textContent = rentVal > 0 ? `₹${rentVal.toLocaleString('en-IN')}/mo` : 'Monthly';
  }

  // Format payment date
  const rawDate = payment.payment_date || new Date().toISOString().split('T')[0];
  const d = new Date(rawDate + 'T00:00:00');
  const dateFormatted = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  if (paymentDate) paymentDate.textContent = dateFormatted;

  const cycleDay = tenancy?.billing_day || 1;
  if (billingCycle) billingCycle.textContent = `Billing Day: ${getOrdinal(cycleDay)}`;

  const isCash = (payment.payment_mode || 'cash').toLowerCase() === 'cash';
  if (isCash) {
    iconCash?.classList.remove('hidden');
    iconOnline?.classList.add('hidden');
    if (paymentMode) paymentMode.textContent = 'Cash Payment';
    if (referenceNo) {
      if (payment.reference_no) {
        referenceNo.textContent = `Ref: ${payment.reference_no}`;
        referenceNo.classList.remove('hidden');
      } else {
        referenceNo.textContent = '';
        referenceNo.classList.add('hidden');
      }
    }
  } else {
    iconCash?.classList.add('hidden');
    iconOnline?.classList.remove('hidden');
    const ch = (payment.channel || 'Online').toUpperCase();
    if (paymentMode) paymentMode.textContent = `Online (${ch})`;
    if (referenceNo) {
      if (payment.reference_no) {
        referenceNo.textContent = `Ref: ${payment.reference_no}`;
        referenceNo.classList.remove('hidden');
      } else {
        referenceNo.textContent = '';
        referenceNo.classList.add('hidden');
      }
    }
  }

  const formatReceiptCurrency = (val) => {
    const n = parseFloat(val || 0);
    return n % 1 === 0
      ? n.toLocaleString('en-IN')
      : n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const amtNum = parseFloat(payment.amount || 0);
  if (totalAmount) {
    totalAmount.textContent = `₹${formatReceiptCurrency(amtNum)}`;
  }

  if (propAddress) {
    propAddress.textContent = tenancy?.address || `${pName} • Residential Tenancy`;
  }

  // Parse settled months
  let monthsArr = [];
  if (Array.isArray(payment.settled_months)) {
    monthsArr = payment.settled_months;
  } else if (typeof payment.settled_months === 'string') {
    try {
      const parsed = JSON.parse(payment.settled_months);
      monthsArr = Array.isArray(parsed) ? parsed : [payment.settled_months];
    } catch {
      monthsArr = [payment.settled_months];
    }
  }

  const shortMonthMap = {
    January: 'Jan', February: 'Feb', March: 'Mar', April: 'Apr',
    May: 'May', June: 'Jun', July: 'Jul', August: 'Aug',
    September: 'Sep', October: 'Oct', November: 'Nov', December: 'Dec'
  };

  // Render allocation breakdown table with EXACT ₹ amounts (No .00 for whole numbers, short month names)
  if (allocationsList) {
    allocationsList.innerHTML = '';
    if (monthsArr.length > 0) {
      monthsArr.forEach((mStr) => {
        const row = document.createElement('div');
        row.className = 'receipt-alloc-row';

        const isAdv = mStr.toLowerCase().includes('advance');
        const isPart = mStr.toLowerCase().includes('partial');

        // Extract amount if present e.g. "October 2026 (₹5,000)" or "November 2026 (Advance: ₹1,000)"
        let allocatedNum = rentVal;
        const amtMatch = mStr.match(/(?:₹|Rs\.?)\s*([\d,]+(?:\.\d+)?)/i);
        if (amtMatch) {
          allocatedNum = parseFloat(amtMatch[1].replace(/,/g, '')) || rentVal;
        } else if (monthsArr.length > 1) {
          if (isAdv) {
            allocatedNum = Math.max(0, amtNum - rentVal) || rentVal;
          } else {
            allocatedNum = Math.min(rentVal, amtNum);
          }
        } else {
          allocatedNum = amtNum || rentVal;
        }

        // Clean month label & convert to short month names (e.g. October 2026 -> Oct 2026)
        let cleanLabel = mStr.replace(/\s*\([^)]*\)/g, '').trim();
        if (!cleanLabel) cleanLabel = mStr;
        for (const [fullM, shortM] of Object.entries(shortMonthMap)) {
          cleanLabel = cleanLabel.replace(new RegExp(`\\b${fullM}\\b`, 'gi'), shortM);
        }

        let tagClass = 'cleared';
        let tagText = 'Cleared';
        let iconSymbol = '✓';

        if (isAdv) {
          tagClass = 'advance';
          tagText = 'Advance';
          iconSymbol = '⏩';
        } else if (isPart) {
          tagClass = 'partial';
          tagText = 'Partial';
          iconSymbol = '⚠️';
        }

        row.innerHTML = `
          <div class="receipt-alloc-row-left">
            <span class="receipt-alloc-row-icon">${iconSymbol}</span>
            <span class="receipt-alloc-row-title">${cleanLabel}</span>
          </div>
          <div class="receipt-alloc-row-right">
            <span class="receipt-alloc-tag ${tagClass}">${tagText}</span>
            <strong class="receipt-alloc-row-amount">₹${formatReceiptCurrency(allocatedNum)}</strong>
          </div>
        `;
        allocationsList.appendChild(row);
      });
    } else {
      const row = document.createElement('div');
      row.className = 'receipt-alloc-row';
      row.innerHTML = `
        <div class="receipt-alloc-row-left">
          <span class="receipt-alloc-row-icon">✓</span>
          <span class="receipt-alloc-row-title">General Rent Payment</span>
        </div>
        <div class="receipt-alloc-row-right">
          <span class="receipt-alloc-tag cleared">Cleared</span>
          <strong class="receipt-alloc-row-amount">₹${formatReceiptCurrency(amtNum)}</strong>
        </div>
      `;
      allocationsList.appendChild(row);
    }
  }

  // Notes
  if (payment.notes && notesRow && notesText) {
    notesText.textContent = payment.notes;
    notesRow.classList.remove('hidden');
  } else if (notesRow) {
    notesRow.classList.add('hidden');
  }

  // Generate deterministic Receipt ID
  const cleanId = (payment.id ? String(payment.id).replace(/[^a-zA-Z0-9]/g, '').slice(0, 10) : String(Date.now()).slice(-8)).toUpperCase();
  if (orderId) {
    orderId.textContent = `Receipt ID: RB-PAY-${cleanId}`;
  }

  navigateToScreen(21);
}

function openShareReceiptModal() {
  const modal = document.getElementById('modal-share-receipt-choice');
  if (modal) {
    modal.classList.remove('hidden');
  }
}

function closeShareReceiptModal() {
  const modal = document.getElementById('modal-share-receipt-choice');
  if (modal) {
    modal.classList.add('hidden');
  }
}

// Format phone number with country code 91 for WhatsApp API
function formatWhatsAppPhone(rawPhone) {
  if (!rawPhone) return '';
  const digits = String(rawPhone).replace(/[^0-9]/g, '');
  if (!digits) return '';
  // If already 12 digits starting with 91 (e.g. 919455866595), return as is
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits;
  }
  // Standard 10-digit Indian mobile number: prepend 91 (e.g. 9455866595 -> 919455866595)
  if (digits.length === 10) {
    return `91${digits}`;
  }
  // 11 digits starting with 0 (e.g. 09455866595): strip 0 and prepend 91
  if (digits.length === 11 && digits.startsWith('0')) {
    return `91${digits.slice(1)}`;
  }
  // If starts with 91 and has 11+ digits
  if (digits.startsWith('91') && digits.length >= 11) {
    return digits;
  }
  // Any other 10+ digits without 91 prefix, prepend 91
  if (digits.length >= 10 && !digits.startsWith('91')) {
    return `91${digits}`;
  }
  return digits;
}

function generateReceiptTextMessage(p, t) {
  const pName = t?.property_name || p?.tenancies?.property_name || 'Rental Unit';
  const rawDate = p?.payment_date || new Date().toISOString().split('T')[0];
  const d = new Date(rawDate + 'T00:00:00');
  const dateFormatted = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  const amtPNum = parseFloat(p?.amount || 0);
  const amtFormatted = amtPNum % 1 === 0 ? amtPNum.toLocaleString('en-IN') : amtPNum.toLocaleString('en-IN', { minimumFractionDigits: 2 });
  const isCash = (p?.payment_mode || 'cash').toLowerCase() === 'cash';
  const mode = isCash ? 'CASH' : `ONLINE (${(p?.channel || 'UPI').toUpperCase()})`;
  const months = Array.isArray(p?.settled_months) ? p.settled_months.join(', ') : (p?.settled_months || 'Settled');
  const cleanId = (p?.id ? String(p.id).replace(/[^a-zA-Z0-9]/g, '').slice(0, 10) : String(Date.now()).slice(-8)).toUpperCase();

  return (
    `🧾 *RENTAL BUDDY — PAYMENT RECEIPT*\n` +
    `Receipt ID: *RB-PAY-${cleanId}*\n` +
    `--------------------------------\n` +
    `🏠 *Property:* ${pName}\n` +
    `📅 *Date:* ${dateFormatted}\n` +
    `💳 *Channel:* ${mode}${p?.reference_no ? ' (Ref: ' + p.reference_no + ')' : ''}\n` +
    `📋 *Covered Cycles:* ${months}\n` +
    `--------------------------------\n` +
    `💰 *TOTAL RECEIVED: ₹${amtFormatted}*\n` +
    `✅ *Status:* Verified & Settled\n` +
    `--------------------------------\n` +
    `✨ Thank you! This digital voucher confirms payment receipt via Rental Buddy.`
  );
}

function handleShareReceiptText() {
  closeShareReceiptModal();
  if (!currentReceiptPayment) return;
  const p = currentReceiptPayment;
  const t = currentReceiptTenancy;
  const receiptMsg = generateReceiptTextMessage(p, t);

  if (navigator.clipboard) {
    navigator.clipboard.writeText(receiptMsg).catch(() => {});
  }

  const rawPhone = t?.tenant_phone || p?.tenancies?.tenant_phone || p?.tenant_phone || currentActiveTenancy?.tenant_phone || '';
  const phoneFormatted = formatWhatsAppPhone(rawPhone);
  const phoneParam = phoneFormatted ? `phone=${phoneFormatted}&` : '';
  const waUrl = `https://api.whatsapp.com/send?${phoneParam}text=${encodeURIComponent(receiptMsg)}`;
  window.open(waUrl, '_blank');
  showToast('📱 Receipt text copied & opening WhatsApp...', 3500);
}

async function handleShareReceiptImage() {
  closeShareReceiptModal();
  if (!currentReceiptPayment) return;
  const p = currentReceiptPayment;
  const t = currentReceiptTenancy;
  const pName = t?.property_name || p?.tenancies?.property_name || 'Rental Unit';
  const amtPNum = parseFloat(p?.amount || 0);
  const amtFormatted = amtPNum % 1 === 0 ? amtPNum.toLocaleString('en-IN') : amtPNum.toLocaleString('en-IN', { minimumFractionDigits: 2 });
  const cleanId = (p?.id ? String(p.id).replace(/[^a-zA-Z0-9]/g, '').slice(0, 10) : String(Date.now()).slice(-8)).toUpperCase();

  const cardElement = document.querySelector('#screen-21 .receipt-ticket-card');
  if (!cardElement) {
    showToast('Unable to find receipt card element', 3000);
    return;
  }

  showToast('Generating high-resolution voucher PNG...', 2200);

  try {
    const canvas = await html2canvas(cardElement, {
      scale: 3,
      useCORS: true,
      backgroundColor: '#EFF0FA', // Canvas background guarantees clean inward cutouts
      logging: false,
    });

    canvas.toBlob(async (blob) => {
      if (!blob) {
        showToast('Could not generate receipt image', 3000);
        return;
      }

      const fileName = `RentalBuddy-Receipt-${cleanId}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      // Web Share API with files (Android / iOS native sharing)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: `Rental Buddy Receipt - ${pName}`,
            text: `Payment Receipt: ₹${amtFormatted} for ${pName} (Receipt ID: RB-PAY-${cleanId})`,
            files: [file]
          });
          showToast('Voucher image shared successfully!', 3500);
          return;
        } catch (shareErr) {
          if (shareErr.name === 'AbortError') return; // Cancelled by user
          console.warn('Native share failed, using download fallback:', shareErr);
        }
      }

      // Desktop / Web Fallback: download PNG file & open WhatsApp
      const downloadUrl = URL.createObjectURL(blob);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = downloadUrl;
      downloadAnchor.download = fileName;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      document.body.removeChild(downloadAnchor);
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 8000);

      const briefCaption = `🧾 *RENTAL BUDDY — PAYMENT RECEIPT*\n` +
        `Receipt ID: *RB-PAY-${cleanId}*\n` +
        `🏠 *Property:* ${pName}\n` +
        `💰 *Amount:* ₹${amtFormatted} (Verified & Settled ✅)\n` +
        `📎 _Receipt voucher image downloaded to your device — attach PNG in WhatsApp chat._`;

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(briefCaption).catch(() => {});
      }

      const rawPhone = t?.tenant_phone || p?.tenancies?.tenant_phone || p?.tenant_phone || currentActiveTenancy?.tenant_phone || '';
      const phoneFormatted = formatWhatsAppPhone(rawPhone);
      const phoneParam = phoneFormatted ? `phone=${phoneFormatted}&` : '';
      const waUrl = `https://api.whatsapp.com/send?${phoneParam}text=${encodeURIComponent(briefCaption)}`;
      window.open(waUrl, '_blank');
      showToast('Receipt PNG downloaded & opening WhatsApp...', 4500);
    }, 'image/png');

  } catch (canvasErr) {
    console.error('Failed to capture receipt snapshot:', canvasErr);
    showToast('Failed to generate receipt image. Falling back to text...', 3000);
    handleShareReceiptText();
  }
}

function initReceiptPage() {
  const btnBack = document.getElementById('btn-receipt-back');
  const btnDone = document.getElementById('btn-receipt-done');
  const btnShareWa = document.getElementById('btn-receipt-share-wa');
  const modalShareChoice = document.getElementById('modal-share-receipt-choice');
  const btnCloseChoice = document.getElementById('btn-close-share-choice');
  const btnShareText = document.getElementById('btn-share-as-text');
  const btnShareImage = document.getElementById('btn-share-as-image');

  btnBack?.addEventListener('click', () => {
    if (state.previousScreen === 10 && currentActiveTenancy) {
      navigateToScreen(10);
    } else {
      navigateToScreen(6);
    }
  });

  btnDone?.addEventListener('click', () => {
    if (currentActiveTenancy) {
      navigateToScreen(10);
    } else {
      navigateToScreen(6);
    }
  });

  // Prompt the modal with two options (Text vs Image)
  btnShareWa?.addEventListener('click', openShareReceiptModal);
  btnCloseChoice?.addEventListener('click', closeShareReceiptModal);
  modalShareChoice?.addEventListener('click', (e) => {
    if (e.target === modalShareChoice) closeShareReceiptModal();
  });

  btnShareText?.addEventListener('click', handleShareReceiptText);
  btnShareImage?.addEventListener('click', handleShareReceiptImage);
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
  initFamilySharingPage();
  initReceiptPage();
  initNumericAndPhoneInputs();

  // Check Supabase Cloud Session on Boot
  const session = await getCurrentSession();

  // Dismiss splash screen smoothly after session state resolves
  const splash = document.getElementById('app-splash-screen');
  if (splash) {
    splash.classList.add('hidden');
  }

  // Subscribe to auth state changes to guarantee session persistence across refreshes & token renewals
  supabase.auth.onAuthStateChange(async (event, currentAuthSession) => {
    if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && currentAuthSession?.user) {
      cloudSession.user = currentAuthSession.user;
      cloudSession.isCloudConnected = true;
      updateAuthUI(currentAuthSession.user);
    } else if (event === 'SIGNED_OUT') {
      cloudSession.user = null;
      cloudSession.profile = null;
      cloudSession.isCloudConnected = false;
      updateAuthUI(null);
    }
  });

  if (!session || !session.user) {
    // STRICT PRODUCTION AUTH GUARD: User is not logged in!
    updateAuthUI(null);
    navigateToScreen(20);
  } else {
    // User is authenticated!
    updateAuthUI(session.user);

    try {
      await syncDashboardFromCloud();
    } catch (bootErr) {
      console.warn('Boot dashboard sync notice:', bootErr);
    }

    const hasData = userHasExistingData(session.user.id);
    if (hasData) {
      localStorage.setItem(`rb_onboarding_completed_${session.user.id}`, 'true');
      try {
        updateUserProfile({ onboarding_completed: true });
      } catch (e) {
        // ignore
      }

      const hash = window.location.hash;
      if (hash && hash.startsWith('#screen-')) {
        const screenNum = parseInt(hash.replace('#screen-', ''), 10);
        if (!isNaN(screenNum) && screenNum >= 1 && screenNum <= 21 && screenNum !== 2 && screenNum !== 20) {
          navigateToScreen(screenNum);
        } else {
          navigateToScreen(6);
        }
      } else {
        navigateToScreen(6);
      }
    } else {
      window.rbFirstTimeOnboarding = true;
      navigateToScreen(2); // Direct first-time user to functional onboarding ONLY if no data exists
    }
  }
});

