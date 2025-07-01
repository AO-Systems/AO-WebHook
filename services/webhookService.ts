
/**
 * Sends a message to a given webhook URL.
 * Assumes the webhook expects a JSON payload with a "text" key,
 * which is common for services like Google Chat and Slack.
 *
 * @param url The webhook URL to send the message to.
 * @param message The text message to send.
 */
export async function sendMessage(url: string, message: string): Promise<void> {
  // Simple URL validation
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    throw new Error('Invalid webhook URL. Must start with http:// or https://');
  }

  const payload = { text: message };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    // Try to get more info from the response body if available
    let errorDetails = `Request failed with status ${response.status}`;
    try {
        const errorData = await response.json();
        errorDetails += `: ${JSON.stringify(errorData.error?.message || errorData)}`;
    } catch (e) {
        // Could not parse error JSON, use text instead
        const errorText = await response.text();
        if(errorText) {
          errorDetails += `: ${errorText}`;
        }
    }
    throw new Error(errorDetails);
  }
}
