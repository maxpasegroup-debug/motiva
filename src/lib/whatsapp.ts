export async function sendWhatsAppMessage(
  mobile: string,
  message: string,
): Promise<void> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim();

  if (!phoneNumberId || !accessToken) {
    throw new Error("WhatsApp credentials not configured");
  }

  const response = await fetch(
    `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: mobile,
        type: "text",
        text: {
          body: message,
        },
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`WhatsApp send failed: ${body || response.statusText}`);
  }
}

export async function sendCredentials(
  mobile: string,
  studentName: string,
  username: string,
  pin: string,
): Promise<void> {
  await sendWhatsAppMessage(
    mobile,
    `Welcome to Motiva Edus, ${studentName}! Your login: Username: ${username} PIN: ${pin} Login at: motivaedus.in/login`,
  );
}
