import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const students = await base44.entities.Student.filter({ created_by: user.email });
    const studentCount = students.length;

    // Self-heal: if this user purchased a district/school plan, ensure they have manager access
    try {
      const managed = await base44.asServiceRole.entities.District.filter({ managerEmail: user.email });
      if (managed.length > 0) {
        if (user.role !== 'manager' && user.role !== 'admin') {
          await base44.asServiceRole.entities.User.update(user.id, { role: 'manager' });
          user.role = 'manager';
          console.log(`Self-heal: promoted ${user.email} to manager of district ${managed[0].id}`);
        }
        if (!managed[0].managerUserId) {
          await base44.asServiceRole.entities.District.update(managed[0].id, { managerUserId: user.id });
        }
      }
    } catch (e) {
      console.error('Manager self-heal failed:', e.message);
    }

    // Check direct Stripe subscription first
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length > 0) {
      const subscriptions = await stripe.subscriptions.list({
        customer: customers.data[0].id,
        status: 'all',
        limit: 1,
      });
      if (subscriptions.data.length > 0) {
        const sub = subscriptions.data[0];
        const isActive = sub.status === 'active' || sub.status === 'trialing';
        const isTrial = sub.status === 'trialing';
        return Response.json({
          status: sub.status,
          isActive,
          isPro: isActive,
          isTrial,
          trialEnd: sub.trial_end,
          currentPeriodEnd: sub.current_period_end,
          studentCount,
        });
      }
    }

    // No direct subscription — check district membership
    let district = null;

    if (user.role === 'manager') {
      const districts = await base44.asServiceRole.entities.District.filter({ managerEmail: user.email });
      if (districts.length > 0) district = districts[0];
    } else {
      // Get districtId from user record
      const userRecords = await base44.asServiceRole.entities.User.filter({ email: user.email });
      let districtId = userRecords[0]?.districtId;

      // Self-heal: apply a pending teacher assignment if their district invited them
      if (!districtId) {
        try {
          const pending = await base44.asServiceRole.entities.PendingTeacherAssignment.filter({ teacherEmail: user.email, status: 'pending' });
          if (pending.length > 0) {
            districtId = pending[0].districtId;
            await base44.asServiceRole.entities.User.update(user.id, { districtId, districtStatus: 'active' });
            await base44.asServiceRole.entities.PendingTeacherAssignment.update(pending[0].id, { status: 'applied' });
            console.log(`Self-heal: applied pending district assignment for ${user.email}`);
          }
        } catch (e) {
          console.error('Teacher self-heal failed:', e.message);
        }
      }

      if (districtId) {
        const districts = await base44.asServiceRole.entities.District.filter({ id: districtId });
        if (districts.length > 0) district = districts[0];
      }
    }

    if (district) {
      const isActive = district.status === 'active' || district.status === 'trialing';
      return Response.json({
        status: district.status,
        isActive,
        isPro: isActive,
        isTrial: district.status === 'trialing',
        trialEnd: district.trialEndDate,
        isDistrict: true,
        districtPlan: district.planName,
        studentCount,
      });
    }

    return Response.json({ status: 'none', isActive: false, isPro: false, isTrial: false, studentCount });
  } catch (error) {
    console.error('Stripe status error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});