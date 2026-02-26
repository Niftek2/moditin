import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { userEmail, originalTransactionId, productId, expirationDate } = body;

    // Validate required fields
    if (!userEmail || !originalTransactionId || !productId || !expirationDate) {
      return Response.json(
        { error: 'Missing required fields: userEmail, originalTransactionId, productId, expirationDate' },
        { status: 400 }
      );
    }

    // Validate user exists (use service role to find by email)
    const users = await base44.asServiceRole.entities.User.filter({
      email: userEmail,
    });

    if (!users || users.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const user = users[0];
    const expirationTime = new Date(expirationDate).getTime();
    const nowTime = Date.now();
    const isActive = expirationTime > nowTime;

    // Store Apple subscription data on user
    const appleSubscription = {
      originalTransactionId,
      productId,
      expirationDate,
      activatedAt: new Date().toISOString(),
      isActive,
    };

    // Update user with Apple subscription data
    await base44.asServiceRole.entities.User.update(user.id, {
      appleSubscription,
    });

    console.log(`Apple subscription activated for ${userEmail}: isActive=${isActive}`);

    return Response.json({
      success: true,
      isActive,
      user: {
        id: user.id,
        email: user.email,
        appleSubscription,
      },
    });
  } catch (error) {
    console.error('Error activating Apple subscription:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});