const CLIENT_ID = "তোমার_AZURE_CLIENT_ID_এখানে_বসাও"; // ← এটা চেঞ্জ করো
const SCOPES = ["Mail.Read"];
const REDIRECT_URI = window.location.origin + window.location.pathname;

let accessToken = null;

document.getElementById("loginBtn").onclick = () => {
  const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/devicecode`;
  fetch("https://login.microsoftonline.com/common/oauth2/v2.0/devicecode", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      scope: SCOPES.join(" ")
    })
  })
  .then(r => r.json())
  .then(data => {
    alert(`কোড কপি করো: \( {data.user_code}\n\nব্রাউজারে যাও: \){data.verification_uri}\nলগইন করে কোড বসাও`);
    
    const poll = setInterval(() => {
      fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "urn:ietf:params:oauth:grant-type:device_code",
          client_id: CLIENT_ID,
          device_code: data.device_code
        })
      })
      .then(r => r.json())
      .then(token => {
        if (token.access_token) {
          clearInterval(poll);
          accessToken = token.access_token;
          document.getElementById("authSection").style.display = "none";
          document.getElementById("checkSection").style.display = "block";
          alert("লগইন সাকসেস! এখন চেক করো");
        }
      });
    }, 5000);
  });
};

document.getElementById("checkBtn").onclick = async () => {
  document.getElementById("loading").style.display = "block";
  document.getElementById("result").innerHTML = "";

  const res = await fetch("https://graph.microsoft.com/v1.0/me/messages?$top=50&$select=subject,from,bodyPreview,id&$orderby=receivedDateTime desc", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    document.getElementById("result").innerHTML = "টোকেন এক্সপায়ার্ড। আবার লগইন করো।";
    document.getElementById("loading").style.display = "none";
    return;
  }

  const data = await res.json();
  for (const mail of data.value) {
    const sender = (mail.from?.emailAddress?.address || "").toLowerCase();
    const subject = (mail.subject || "").toLowerCase();
    const preview = (mail.bodyPreview || "").toLowerCase();

    if ([sender, subject, preview].some(t => t.includes("textnow") || t.includes("verify"))) {
      const full = await fetch(`https://graph.microsoft.com/v1.0/me/messages/${mail.id}/$value`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const body = await full.text();
      const links = body.match(/https?:\/\/[^\s<>"']+/g) || [];

      for (const link of links) {
        if (link.length > 60 && /verify|confirm|account\.live\.com|login\.live\.com|microsoft/i.test(link) && 
            !/unsubscribe|textnow\.com/i.test(link)) {
          const clean = link.split('&')[0];
          document.getElementById("result").innerHTML = `
            <h3>আসল লিঙ্ক পাওয়া গেছে!</h3>
            <code>${clean}</code><br><br>
            <a href="${clean}" target="_blank">ক্লিক করো</a>
          `;
          document.getElementById("loading").style.display = "none";
          return;
        }
      }
    }
  }

  document.getElementById("result").innerHTML = "TextNow মেইল পাওয়া যায়নি।";
  document.getElementById("loading").style.display = "none";
};
