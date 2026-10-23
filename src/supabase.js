// ==========================================================================
// RENTAL BUDDY — SUPABASE CLIENT & CLOUD SERVICE
// ==========================================================================

import { createClient } from '@supabase/supabase-js';

// Project Cloud Credentials
export const SUPABASE_URL = 'https://hxflqcvhtkfpjjkociaq.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4ZmxxY3ZodGtmcGpqa29jaWFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxNzgyMjUsImV4cCI6MjEwNzc1NDIyNX0.8iILKV_RrssDMUR9oEcJ5t9KyLdzSZFOfM5GHkKuI8U';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// App Session State
export const cloudSession = {
  user: null,
  profile: null,
  role: 'admin', // 'admin' | 'family'
  isCloudConnected: false,
};

// ==========================================================================
// AUTHENTICATION SERVICES
// ==========================================================================

export async function ensureAuthenticated() {
  if (cloudSession.user) return cloudSession.user;
  const session = await getCurrentSession();
  if (session && session.user) {
    cloudSession.user = session.user;
    cloudSession.isCloudConnected = true;
    return session.user;
  }
  return null;
}

export const getCurrentUser = ensureAuthenticated;

export async function signInUser(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    cloudSession.user = data.user;
    cloudSession.isCloudConnected = true;
    await syncUserProfile();
    return { success: true, user: data.user };
  } catch (err) {
    console.error('Supabase Sign In Error:', err);
    return { success: false, error: err.message };
  }
}

// Dynamic Auth Redirect URL (Guarantees Supabase emails redirect to rentalbuddy.pages.dev)
export function getAuthRedirectUrl(subpath = '/login') {
  if (typeof window !== 'undefined') {
    if (window.location.origin.includes('pages.dev') || window.location.origin.includes('rentalbuddy')) {
      return `${window.location.origin}${subpath}`;
    }
    return `${window.location.origin}${subpath}`;
  }
  return `https://rentalbuddy.pages.dev${subpath}`;
}

export async function signUpUser(email, password, fullName = '') {
  try {
    const cleanFullName = (fullName || '').trim();
    const redirectUrl = getAuthRedirectUrl('/login');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: cleanFullName || email.split('@')[0],
        },
      },
    });
    if (error) throw error;

    // Only establish active session if Supabase returned a session immediately
    if (data.session) {
      cloudSession.user = data.user;
      cloudSession.isCloudConnected = true;
      if (data.user) {
        const { data: prof } = await supabase.from('profiles').upsert({
          id: data.user.id,
          email: data.user.email,
          full_name: cleanFullName || email.split('@')[0],
        }).select().single();
        if (prof) cloudSession.profile = prof;
      }
    }

    return {
      success: true,
      user: data.user,
      session: data.session,
      needsEmailConfirmation: !data.session,
    };
  } catch (err) {
    console.error('Supabase Sign Up Error:', err);
    return { success: false, error: err.message };
  }
}

export async function resendVerificationEmail(email) {
  try {
    const redirectUrl = getAuthRedirectUrl('/login');
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('Resend Verification Error:', err);
    return { success: false, error: err.message };
  }
}

export async function resetUserPassword(email) {
  try {
    const redirectUrl = getAuthRedirectUrl('/login');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('Password Reset Error:', err);
    return { success: false, error: err.message };
  }
}

export async function updateUserProfile(updates) {
  if (!cloudSession.user) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', cloudSession.user.id)
      .select()
      .single();
    if (error) throw error;
    cloudSession.profile = data;
    return data;
  } catch (err) {
    console.warn('Update Profile Error:', err);
    return null;
  }
}

export async function deleteUserAccountAndData() {
  await ensureAuthenticated();
  if (!cloudSession.user) return false;
  const userId = cloudSession.user.id;
  try {
    // 1. Primary: Execute SECURITY DEFINER RPC to completely erase data AND auth.users
    const { error: rpcError } = await supabase.rpc('delete_user_account');

    if (rpcError) {
      console.warn('RPC delete_user_account error, attempting direct cleanup:', rpcError);
      const { data: userTenancies } = await supabase
        .from('tenancies')
        .select('id')
        .eq('owner_id', userId);

      const tenancyIds = (userTenancies || []).map((t) => t.id);

      if (tenancyIds.length > 0) {
        await supabase.from('payments').delete().in('tenancy_id', tenancyIds);
        await supabase.from('bills').delete().in('tenancy_id', tenancyIds);
        await supabase.from('tenancy_utilities').delete().in('tenancy_id', tenancyIds);
        await supabase.from('rent_revisions').delete().in('tenancy_id', tenancyIds);
        await supabase.from('tenancies').delete().eq('owner_id', userId);
      }

      await supabase.from('family_shares').delete().eq('admin_id', userId);
      await supabase.from('profiles').delete().eq('id', userId);
    }

    try {
      await supabase.auth.signOut();
    } catch (e) {
      // User was already deleted from auth.users
    }

    cloudSession.user = null;
    cloudSession.profile = null;
    cloudSession.isCloudConnected = false;
    return true;
  } catch (err) {
    console.error('Delete User Account Error:', err);
    throw err;
  }
}

export async function signOutUser() {
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.warn('Sign Out Warning:', err);
  } finally {
    cloudSession.user = null;
    cloudSession.profile = null;
    cloudSession.isCloudConnected = false;
  }
}

export async function syncUserProfile() {
  if (!cloudSession.user) return null;
  const user = cloudSession.user;
  const metaFullName = (user.user_metadata?.full_name || user.user_metadata?.name || '').trim();
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error && error.code === 'PGRST116') {
      // Create if missing
      const resolvedName = metaFullName || user.email.split('@')[0];
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          full_name: resolvedName,
        })
        .select()
        .single();
      cloudSession.profile = newProfile;
      return newProfile;
    }

    if (data) {
      // If full_name is missing or is just the email username, but user_metadata has a real full name, update it!
      const emailUser = user.email.split('@')[0];
      if (metaFullName && (!data.full_name || data.full_name === emailUser || data.full_name === user.email)) {
        await supabase
          .from('profiles')
          .update({ full_name: metaFullName })
          .eq('id', user.id);
        data.full_name = metaFullName;
      }
      cloudSession.profile = data;
      return data;
    }

    cloudSession.profile = data;
    return data;
  } catch (err) {
    console.error('Profile Sync Error:', err);
    return null;
  }
}

export async function getCurrentSession() {
  try {
    const { data } = await supabase.auth.getSession();
    if (data && data.session) {
      cloudSession.user = data.session.user;
      cloudSession.isCloudConnected = true;
      await syncUserProfile();
      return data.session;
    }
  } catch (err) {
    console.warn('Get Session Warning:', err);
  }
  return null;
}

// ==========================================================================
// CONNECTIVITY & OFFLINE SAFETY GUARD
// ==========================================================================

export function assertOnline(actionName = 'perform this action') {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error(`You are currently offline. An active internet connection is required to ${actionName}.`);
  }
}

// ==========================================================================
// TENANCIES CLOUD CRUD
// ==========================================================================

export async function fetchCloudTenancies(status = 'active') {
  await ensureAuthenticated();
  if (!cloudSession.user) return [];
  const cacheKey = `rb_cache_tenancies_${cloudSession.user.id}_${status}`;

  // If offline, return cached snapshot immediately
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('tenancies')
      .select(
        `
        *,
        tenancy_utilities (*),
        rent_revisions (*)
      `
      )
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (data) {
      try { localStorage.setItem(cacheKey, JSON.stringify(data)); } catch (e) {}
    }
    return data || [];
  } catch (err) {
    console.warn('Fetch Tenancies Network Notice, falling back to cache:', err);
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return [];
  }
}

export async function createCloudTenancy(tenancyData) {
  assertOnline('create a new tenancy');
  await ensureAuthenticated();
  if (!cloudSession.user) return null;
  try {
    const { data, error } = await supabase
      .from('tenancies')
      .insert({
        owner_id: cloudSession.user.id,
        property_name: tenancyData.propertyName,
        tenant_name: tenancyData.tenantName || 'Tenant',
        tenant_phone: tenancyData.tenantPhone || '',
        base_rent: parseFloat(tenancyData.baseRent) || 0,
        advance_amount: parseFloat(tenancyData.advanceAmount) || 0,
        billing_day: parseInt(tenancyData.billingDay, 10) || 1,
        start_date: tenancyData.startDate || new Date().toISOString().split('T')[0],
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;

    // Also insert utilities if present with valid check constraints
    if (tenancyData.utilities && Array.isArray(tenancyData.utilities) && tenancyData.utilities.length > 0) {
      const utilsToInsert = tenancyData.utilities.map((u) => {
        let cleanBillType = (u.bill_type || 'flat').toLowerCase().trim();
        if (cleanBillType === 'meter' || cleanBillType.includes('meter')) {
          cleanBillType = 'meter_reading';
        } else {
          cleanBillType = 'flat';
        }
        return {
          tenancy_id: data.id,
          utility_type: u.utility_type,
          is_enabled: u.is_enabled !== false,
          bill_type: cleanBillType,
          price_per_unit: parseFloat(u.price_per_unit) || 0,
          flat_amount: parseFloat(u.flat_amount) || 0,
          last_meter_reading: parseFloat(u.last_meter_reading) || 0,
        };
      });

      const { error: utilError } = await supabase.from('tenancy_utilities').insert(utilsToInsert);
      if (utilError) console.warn('Utilities insert warning:', utilError);
    }

    return data;
  } catch (err) {
    console.error('Create Tenancy Error:', err);
    throw err;
  }
}

export async function updateCloudTenancy(tenancyId, updates) {
  try {
    const { data, error } = await supabase
      .from('tenancies')
      .update(updates)
      .eq('id', tenancyId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Update Tenancy Error:', err);
    throw err;
  }
}

export async function updateCloudTenancyUtilities(tenancyId, utilities) {
  await ensureAuthenticated();
  if (!tenancyId || !Array.isArray(utilities)) return [];
  try {
    const upsertData = utilities.map((u) => {
      let cleanBillType = (u.bill_type || 'flat').toLowerCase().trim();
      if (cleanBillType === 'meter' || cleanBillType.includes('meter')) {
        cleanBillType = 'meter_reading';
      } else {
        cleanBillType = 'flat';
      }
      return {
        tenancy_id: tenancyId,
        utility_type: u.utility_type,
        is_enabled: u.is_enabled !== false,
        bill_type: cleanBillType,
        price_per_unit: parseFloat(u.price_per_unit) || 0,
        flat_amount: parseFloat(u.flat_amount) || 0,
        last_meter_reading: parseFloat(u.last_meter_reading) || 0,
      };
    });

    const { data, error } = await supabase
      .from('tenancy_utilities')
      .upsert(upsertData, { onConflict: 'tenancy_id,utility_type' })
      .select();

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Update Utilities Error:', err);
    throw err;
  }
}

async function verifyWritePermission(tenancyId) {
  try {
    const user = await ensureAuthenticated();
    if (!user) throw new Error('Authentication required');
    // Check if owner
    const { data: tenancy } = await supabase
      .from('tenancies')
      .select('owner_id')
      .eq('id', tenancyId)
      .maybeSingle();
    if (tenancy && tenancy.owner_id === user.id) return true;

    // If not owner, check if user is manager in approved family share
    const userEmail = (user.email || '').toLowerCase().trim();
    const { data: shares } = await supabase
      .from('family_shares')
      .select('role, tenancy_ids, status')
      .or(`member_email.eq.${userEmail},member_id.eq.${user.id}`)
      .in('status', ['approved', 'accepted']);

    if (shares && shares.length > 0) {
      const isManager = shares.some((s) => {
        const matchTenancy = !s.tenancy_ids || !Array.isArray(s.tenancy_ids) || s.tenancy_ids.length === 0 || s.tenancy_ids.includes(tenancyId);
        return matchTenancy && s.role === 'manager';
      });
      if (isManager) return true;
    }

    throw new Error('Viewer access: you do not have permission to archive, unarchive, or delete this property');
  } catch (err) {
    console.error('Permission check failed:', err);
    throw err;
  }
}

export async function archiveCloudTenancy(tenancyId) {
  await verifyWritePermission(tenancyId);
  return updateCloudTenancy(tenancyId, {
    status: 'archived',
    archived_at: new Date().toISOString(),
  });
}

export async function unarchiveCloudTenancy(tenancyId) {
  await verifyWritePermission(tenancyId);
  return updateCloudTenancy(tenancyId, {
    status: 'active',
    archived_at: null,
  });
}

export async function deleteCloudTenancy(tenancyId) {
  await verifyWritePermission(tenancyId);
  try {
    // Delete child records first to satisfy foreign key constraints
    await supabase.from('payments').delete().eq('tenancy_id', tenancyId);
    await supabase.from('bills').delete().eq('tenancy_id', tenancyId);
    await supabase.from('tenancy_utilities').delete().eq('tenancy_id', tenancyId);
    await supabase.from('rent_revisions').delete().eq('tenancy_id', tenancyId);

    const { error } = await supabase
      .from('tenancies')
      .delete()
      .eq('id', tenancyId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Delete Tenancy Error:', err);
    throw err;
  }
}

// ==========================================================================
// RENT REVISIONS
// ==========================================================================

export async function scheduleCloudRentRevision(revisionData) {
  try {
    // Supersede any existing scheduled revisions for this tenancy to ensure single active revision integrity
    await supabase
      .from('rent_revisions')
      .update({ status: 'cancelled' })
      .eq('tenancy_id', revisionData.tenancyId)
      .eq('status', 'scheduled');

    const { data, error } = await supabase
      .from('rent_revisions')
      .insert({
        tenancy_id: revisionData.tenancyId,
        old_rent: parseFloat(revisionData.oldRent) || 0,
        new_rent: parseFloat(revisionData.newRent) || 0,
        effective_date: revisionData.effectiveDate,
        note: revisionData.note || '',
        notify_tenant: !!revisionData.notifyTenant,
        status: 'scheduled',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Schedule Rent Revision Error:', err);
    throw err;
  }
}

export async function cancelCloudRentRevision(idOrTenancyId) {
  try {
    const { data, error } = await supabase
      .from('rent_revisions')
      .update({ status: 'cancelled' })
      .or(`id.eq.${idOrTenancyId},tenancy_id.eq.${idOrTenancyId}`)
      .eq('status', 'scheduled')
      .select();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Cancel Rent Revision Error:', err);
    throw err;
  }
}

export async function applyDueRentRevisions(tenancy) {
  if (!tenancy || !Array.isArray(tenancy.rent_revisions)) return tenancy;
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const dueRevisions = tenancy.rent_revisions.filter((r) => {
    return r.status === 'scheduled' && r.effective_date && r.effective_date <= todayStr;
  });

  if (dueRevisions.length === 0) return tenancy;

  dueRevisions.sort((a, b) => new Date(a.effective_date) - new Date(b.effective_date));

  for (const rev of dueRevisions) {
    try {
      await updateCloudTenancy(tenancy.id, {
        base_rent: parseFloat(rev.new_rent),
      });
      await supabase
        .from('rent_revisions')
        .update({ status: 'applied' })
        .eq('id', rev.id);

      rev.status = 'applied';
      tenancy.base_rent = parseFloat(rev.new_rent);
      console.log(`✅ Applied scheduled rent revision for ${tenancy.property_name}: ₹${rev.old_rent} -> ₹${rev.new_rent}`);
    } catch (e) {
      console.warn('Failed to auto-apply rent revision:', e);
    }
  }

  return tenancy;
}

export async function fetchCloudRentRevisions(tenancyId) {
  await ensureAuthenticated();
  try {
    let query = supabase
      .from('rent_revisions')
      .select('*')
      .order('effective_date', { ascending: false });

    if (tenancyId) {
      query = query.eq('tenancy_id', tenancyId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Fetch Rent Revisions Error:', err);
    return [];
  }
}


// ==========================================================================
// BILLS & INVOICES
// ==========================================================================

export async function fetchCloudBills(tenancyId) {
  await ensureAuthenticated();
  const cacheKey = `rb_cache_bills_${cloudSession.user?.id || 'anon'}_${tenancyId || 'all'}`;

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return [];
  }

  try {
    let query = supabase.from('bills').select('*, tenancies (property_name)').order('created_at', { ascending: false });
    if (tenancyId) {
      query = query.eq('tenancy_id', tenancyId);
    }
    const { data, error } = await query;
    if (error) throw error;
    if (data) {
      try { localStorage.setItem(cacheKey, JSON.stringify(data)); } catch (e) {}
    }
    return data || [];
  } catch (err) {
    console.warn('Fetch Bills Network Notice, falling back to cache:', err);
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return [];
  }
}

export async function createCloudBill(billData) {
  assertOnline('generate a new bill');
  await ensureAuthenticated();
  try {
    const invoiceNum =
      billData.invoiceNumber ||
      `INV-${Date.now().toString().slice(-6)}`;

    const { data, error } = await supabase
      .from('bills')
      .insert({
        tenancy_id: billData.tenancyId,
        invoice_number: invoiceNum,
        duration_start: billData.durationStart,
        duration_end: billData.durationEnd,
        generated_date: billData.generatedDate || new Date().toISOString().split('T')[0],
        base_rent: parseFloat(billData.baseRent) || 0,
        electricity_units: parseFloat(billData.electricityUnits) || 0,
        electricity_cost: parseFloat(billData.electricityCost) || 0,
        water_units: parseFloat(billData.waterUnits) || 0,
        water_cost: parseFloat(billData.waterCost) || 0,
        other_utilities_cost: parseFloat(billData.otherUtilitiesCost) || 0,
        subtotal: parseFloat(billData.subtotal) || 0,
        advance_deducted: parseFloat(billData.advanceDeducted) || 0,
        due_carried: parseFloat(billData.dueCarried) || 0,
        net_payable: parseFloat(billData.netPayable) || 0,
        status: billData.status || 'unpaid',
        notes: billData.notes || '',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Create Bill Error:', err);
    throw err;
  }
}

// ==========================================================================
// PAYMENTS & SETTLEMENTS
// ==========================================================================

export async function fetchCloudPayments(tenancyId) {
  await ensureAuthenticated();
  const cacheKey = `rb_cache_payments_${cloudSession.user?.id || 'anon'}_${tenancyId || 'all'}`;

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return [];
  }

  try {
    let query = supabase.from('payments').select('*, tenancies (property_name)').order('created_at', { ascending: false });
    if (tenancyId) {
      query = query.eq('tenancy_id', tenancyId);
    }
    const { data, error } = await query;
    if (error) throw error;
    if (data) {
      try { localStorage.setItem(cacheKey, JSON.stringify(data)); } catch (e) {}
    }
    return data || [];
  } catch (err) {
    console.warn('Fetch Payments Network Notice, falling back to cache:', err);
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return [];
  }
}

export async function recordCloudPayment(paymentData) {
  assertOnline('record a payment');
  await ensureAuthenticated();
  try {
    // Sanitize Channel & Payment Mode to strictly satisfy Postgres check constraints:
    // CHECK ((channel = ANY (ARRAY['upi'::text, 'bank'::text, 'neft'::text, 'other'::text, 'cash'::text])))
    // CHECK ((payment_mode = ANY (ARRAY['cash'::text, 'online'::text])))
    const validChannels = ['upi', 'bank', 'neft', 'other', 'cash'];
    let cleanChannel = (paymentData.channel || 'cash').toLowerCase().trim();
    if (cleanChannel.includes('gpay') || cleanChannel.includes('upi')) cleanChannel = 'upi';
    else if (cleanChannel.includes('neft')) cleanChannel = 'neft';
    else if (cleanChannel.includes('bank')) cleanChannel = 'bank';
    else if (cleanChannel.includes('other')) cleanChannel = 'other';
    else if (!validChannels.includes(cleanChannel)) cleanChannel = 'cash';

    let cleanMode = (paymentData.paymentMode || 'cash').toLowerCase().trim();
    if (cleanMode !== 'cash' && cleanMode !== 'online') {
      cleanMode = cleanChannel === 'cash' ? 'cash' : 'online';
    }

    const { data, error } = await supabase
      .from('payments')
      .insert({
        tenancy_id: paymentData.tenancyId,
        bill_id: paymentData.billId || null,
        amount: parseFloat(paymentData.amount) || 0,
        payment_mode: cleanMode,
        channel: cleanChannel,
        reference_no: paymentData.referenceNo || null,
        settled_months: paymentData.settledMonths || [],
        payment_date: paymentData.paymentDate || new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (error) throw error;

    // Settle corresponding unpaid bills: update status = 'paid'
    try {
      if (paymentData.settledBillIds && Array.isArray(paymentData.settledBillIds) && paymentData.settledBillIds.length > 0) {
        await supabase
          .from('bills')
          .update({ status: 'paid' })
          .in('id', paymentData.settledBillIds);
      } else if (paymentData.billId) {
        await supabase
          .from('bills')
          .update({ status: 'paid' })
          .eq('id', paymentData.billId);
      } else if (paymentData.tenancyId) {
        // If payment matches an unpaid bill for this tenancy, mark it paid
        const { data: unpaidBills } = await supabase
          .from('bills')
          .select('id, net_payable')
          .eq('tenancy_id', paymentData.tenancyId)
          .eq('status', 'unpaid')
          .order('created_at', { ascending: true })
          .limit(1);

        if (unpaidBills && unpaidBills.length > 0 && Math.abs(parseFloat(unpaidBills[0].net_payable) - parseFloat(paymentData.amount)) < 1) {
          await supabase
            .from('bills')
            .update({ status: 'paid' })
            .eq('id', unpaidBills[0].id);
        }
      }
    } catch (settleErr) {
      console.warn('Bill settlement status notice:', settleErr);
    }

    return data;
  } catch (err) {
    console.error('Record Payment Error:', err);
    throw err;
  }
}

// ==========================================================================
// FAMILY SHARING
// ==========================================================================

export async function fetchOutgoingFamilyShares() {
  await ensureAuthenticated();
  if (!cloudSession.user) return [];
  try {
    const { data, error } = await supabase
      .from('family_shares')
      .select('*')
      .eq('admin_id', cloudSession.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    const shares = data || [];

    // Fetch recipient profiles for member_ids to get recipient's full name
    const memberIds = [...new Set(shares.map((s) => s.member_id).filter(Boolean))];
    if (memberIds.length > 0) {
      const { data: memberProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', memberIds);

      if (memberProfiles && memberProfiles.length > 0) {
        const memberMap = {};
        memberProfiles.forEach((p) => { memberMap[p.id] = p; });
        shares.forEach((s) => {
          const prof = memberMap[s.member_id];
          if (prof && prof.full_name) {
            s.member_name = prof.full_name;
          }
        });
      }
    }
    return shares;
  } catch (err) {
    console.error('Fetch Outgoing Family Shares Error:', err);
    return [];
  }
}

export async function fetchIncomingFamilyShares() {
  await ensureAuthenticated();
  if (!cloudSession.user) return [];
  try {
    const userEmail = (cloudSession.user.email || '').toLowerCase().trim();
    const { data, error } = await supabase
      .from('family_shares')
      .select('*')
      .or(`member_email.eq.${userEmail},member_id.eq.${cloudSession.user.id}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    const shares = data || [];

    // Fetch profiles for admin_ids to resolve real full names
    const adminIds = [...new Set(shares.map((s) => s.admin_id).filter(Boolean))];
    if (adminIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', adminIds);

      if (profilesData && profilesData.length > 0) {
        const profileMap = {};
        profilesData.forEach((p) => { profileMap[p.id] = p; });
        shares.forEach((s) => {
          const prof = profileMap[s.admin_id];
          if (prof && prof.full_name) {
            s.admin_name = prof.full_name;
          }
        });
      }
    }
    return shares;
  } catch (err) {
    console.error('Fetch Incoming Family Shares Error:', err);
    return [];
  }
}

export async function createSelectiveFamilyShare({ email, role = 'viewer', tenancyIds = [], tenancyNames = [] }) {
  await ensureAuthenticated();
  if (!cloudSession.user) throw new Error('User not authenticated');
  const cleanEmail = (email || '').trim().toLowerCase();
  const ownerEmail = (cloudSession.user.email || '').trim().toLowerCase();

  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Please enter a valid recipient email address');
  }
  if (cleanEmail === ownerEmail) {
    throw new Error('You cannot share properties with your own email');
  }

  const cleanRole = role === 'manager' ? 'manager' : 'viewer';
  const cleanTenancyIds = Array.isArray(tenancyIds) ? tenancyIds : [];
  const cleanTenancyNames = Array.isArray(tenancyNames) ? tenancyNames : [];
  const adminName =
    cloudSession.profile?.full_name ||
    cloudSession.user.user_metadata?.full_name ||
    cloudSession.user.user_metadata?.name ||
    cloudSession.user.email.split('@')[0];

  try {
    const { data, error } = await supabase
      .from('family_shares')
      .upsert(
        {
          admin_id: cloudSession.user.id,
          admin_email: cloudSession.user.email,
          admin_name: adminName,
          member_email: cleanEmail,
          role: cleanRole,
          tenancy_ids: cleanTenancyIds,
          tenancy_names: cleanTenancyNames,
          status: 'pending',
        },
        { onConflict: 'admin_id,member_email' }
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Create Family Share Error:', err);
    throw err;
  }
}

export async function respondToFamilyShare(shareId, accept = true) {
  await ensureAuthenticated();
  if (!cloudSession.user) throw new Error('User not authenticated');
  const newStatus = accept ? 'approved' : 'denied';

  try {
    const { data, error } = await supabase
      .from('family_shares')
      .update({
        status: newStatus,
        member_id: cloudSession.user.id,
      })
      .eq('id', shareId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Respond to Family Share Error:', err);
    throw err;
  }
}

export async function revokeFamilyShare(shareId) {
  await ensureAuthenticated();
  try {
    const { data, error } = await supabase
      .from('family_shares')
      .delete()
      .eq('id', shareId)
      .select();

    if (error) throw error;

    // Double assurance: if delete affected 0 rows via RLS, mark as revoked
    if (!data || data.length === 0) {
      await supabase
        .from('family_shares')
        .update({ status: 'revoked' })
        .eq('id', shareId);
    }
    return true;
  } catch (err) {
    console.error('Revoke Family Share Error:', err);
    throw err;
  }
}

export const leaveFamilyShare = revokeFamilyShare;

export async function updateFamilyShareRole(shareId, newRole) {
  await ensureAuthenticated();
  if (!cloudSession.user) throw new Error('User not authenticated');
  const cleanRole = newRole === 'manager' ? 'manager' : 'viewer';

  try {
    const { data, error } = await supabase
      .from('family_shares')
      .update({ role: cleanRole })
      .eq('id', shareId)
      .eq('admin_id', cloudSession.user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Update Family Share Role Error:', err);
    throw err;
  }
}

// Backward-compatible aliases
export const fetchCloudFamilyMembers = fetchOutgoingFamilyShares;
export const inviteCloudFamilyMember = (email, role) => createSelectiveFamilyShare({ email, role, tenancyIds: [] });
export const revokeCloudFamilyMember = revokeFamilyShare;

// ==========================================================================
// SUPABASE REALTIME WEB-SOCKET SUBSCRIPTIONS (LIVE MULTI-USER SYNC)
// ==========================================================================

let realtimeChannel = null;

export function initSupabaseRealtime(onDataChanged) {
  if (!cloudSession.user) return null;
  if (realtimeChannel) {
    try {
      supabase.removeChannel(realtimeChannel);
    } catch (e) {}
    realtimeChannel = null;
  }

  // Subscribe to live postgres changes across core ledger tables
  realtimeChannel = supabase
    .channel('rental-buddy-live-sync')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tenancies' }, (payload) => {
      console.log('Realtime tenancies change:', payload);
      if (typeof onDataChanged === 'function') onDataChanged('tenancies', payload);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, (payload) => {
      console.log('Realtime payments change:', payload);
      if (typeof onDataChanged === 'function') onDataChanged('payments', payload);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'bills' }, (payload) => {
      console.log('Realtime bills change:', payload);
      if (typeof onDataChanged === 'function') onDataChanged('bills', payload);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'rent_revisions' }, (payload) => {
      console.log('Realtime rent_revisions change:', payload);
      if (typeof onDataChanged === 'function') onDataChanged('rent_revisions', payload);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'family_shares' }, (payload) => {
      console.log('Realtime family_shares change:', payload);
      if (typeof onDataChanged === 'function') onDataChanged('family_shares', payload);
    })
    .subscribe((status) => {
      console.log('Supabase Realtime status:', status);
    });

  return realtimeChannel;
}

