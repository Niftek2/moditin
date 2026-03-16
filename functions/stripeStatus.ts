import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const students = await base44.entities.Student.filter({ created_by: user.email });
    const studentCount = students.length;

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
      const districtId = userRecords[0]?.districtId;
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