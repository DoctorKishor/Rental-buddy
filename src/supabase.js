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

export async function signUpUser(email, password, fullName = '') {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || email.split('@')[0],
        },
      },
    });
    if (error) throw error;
    cloudSession.user = data.user;
    cloudSession.isCloudConnected = true;

    // Ensure profile row exists
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: data.user.email,
        full_name: fullName || email.split('@')[0],
      });
    }

    return { success: true, user: data.user };
  } catch (err) {
    console.error('Supabase Sign Up Error:', err);
    return { success: false, error: err.message };
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
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', cloudSession.user.id)
      .single();

    if (error && error.code === 'PGRST116') {
      // Create if missing
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert({
          id: cloudSession.user.id,
          email: cloudSession.user.email,
          full_name: cloudSession.user.email.split('@')[0],
        })
        .select()
        .single();
      cloudSession.profile = newProfile;
      return newProfile;
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
// TENANCIES CLOUD CRUD
// ==========================================================================

export async function fetchCloudTenancies(status = 'active') {
  if (!cloudSession.user) return [];
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
    return data || [];
  } catch (err) {
    console.error('Fetch Tenancies Error:', err);
    return [];
  }
}

export async function createCloudTenancy(tenancyData) {
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
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;

    // Also insert utilities if present
    if (tenancyData.utilities && Array.isArray(tenancyData.utilities)) {
      const utilsToInsert = tenancyData.utilities.map((u) => ({
        tenancy_id: data.id,
        utility_type: u.utility_type,
        is_enabled: u.is_enabled !== false,
        bill_type: u.bill_type || 'flat',
        price_per_unit: parseFloat(u.price_per_unit) || 0,
        flat_amount: parseFloat(u.flat_amount) || 0,
        last_meter_reading: parseFloat(u.last_meter_reading) || 0,
      }));

      await supabase.from('tenancy_utilities').insert(utilsToInsert);
    }

    return data;
  } catch (err) {
    console.error('Create Tenancy Error:', err);
    return null;
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
    return null;
  }
}

export async function archiveCloudTenancy(tenancyId) {
  return updateCloudTenancy(tenancyId, {
    status: 'archived',
    archived_at: new Date().toISOString(),
  });
}

export async function unarchiveCloudTenancy(tenancyId) {
  return updateCloudTenancy(tenancyId, {
    status: 'active',
    archived_at: null,
  });
}

export async function deleteCloudTenancy(tenancyId) {
  try {
    const { error } = await supabase
      .from('tenancies')
      .delete()
      .eq('id', tenancyId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Delete Tenancy Error:', err);
    return false;
  }
}

// ==========================================================================
// RENT REVISIONS
// ==========================================================================

export async function scheduleCloudRentRevision(revisionData) {
  try {
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
    return null;
  }
}

export async function cancelCloudRentRevision(revisionId) {
  try {
    const { data, error } = await supabase
      .from('rent_revisions')
      .update({ status: 'cancelled' })
      .eq('id', revisionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Cancel Rent Revision Error:', err);
    return null;
  }
}

// ==========================================================================
// BILLS & INVOICES
// ==========================================================================

export async function fetchCloudBills(tenancyId) {
  try {
    let query = supabase.from('bills').select('*').order('created_at', { ascending: false });
    if (tenancyId) {
      query = query.eq('tenancy_id', tenancyId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Fetch Bills Error:', err);
    return [];
  }
}

export async function createCloudBill(billData) {
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
    return null;
  }
}

// ==========================================================================
// PAYMENTS & SETTLEMENTS
// ==========================================================================

export async function fetchCloudPayments(tenancyId) {
  try {
    let query = supabase.from('payments').select('*, tenancies (property_name)').order('created_at', { ascending: false });
    if (tenancyId) {
      query = query.eq('tenancy_id', tenancyId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Fetch Payments Error:', err);
    return [];
  }
}

export async function recordCloudPayment(paymentData) {
  try {
    const { data, error } = await supabase
      .from('payments')
      .insert({
        tenancy_id: paymentData.tenancyId,
        bill_id: paymentData.billId || null,
        amount: parseFloat(paymentData.amount) || 0,
        payment_mode: paymentData.paymentMode || 'cash',
        channel: paymentData.channel || 'cash',
        reference_no: paymentData.referenceNo || null,
        settled_months: paymentData.settledMonths || [],
        payment_date: paymentData.paymentDate || new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Record Payment Error:', err);
    return null;
  }
}

// ==========================================================================
// FAMILY SHARING
// ==========================================================================

export async function fetchCloudFamilyMembers() {
  if (!cloudSession.user) return [];
  try {
    const { data, error } = await supabase
      .from('family_shares')
      .select('*')
      .eq('admin_id', cloudSession.user.id)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Fetch Family Shares Error:', err);
    return [];
  }
}

export async function inviteCloudFamilyMember(email, role = 'viewer') {
  if (!cloudSession.user) return null;
  try {
    const { data, error } = await supabase
      .from('family_shares')
      .upsert({
        admin_id: cloudSession.user.id,
        member_email: email.trim().toLowerCase(),
        role: role,
        status: 'accepted',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Invite Family Member Error:', err);
    return null;
  }
}

export async function revokeCloudFamilyMember(shareId) {
  try {
    const { error } = await supabase
      .from('family_shares')
      .delete()
      .eq('id', shareId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Revoke Family Member Error:', err);
    return false;
  }
}
