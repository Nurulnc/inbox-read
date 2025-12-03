// IMAP দিয়ে Outlook কানেক্ট (imap.js লাইব্রেরি ব্যবহার করো — CDN থেকে লোড)
const Imap = require('imap');  // Node.js-এ Vercel-এ চালাবে, GitHub-এর জন্য অ্যাডাপ্ট করো

function checkTNMail(email, password) {
  const imap = new Imap({
    user: email,
    password: password,  // App Password ব্যবহার করো
    host: 'outlook.office365.com',
    port: 993,
    tls: true
  });

  imap.once('ready', () => {
    imap.openBox('INBOX', true, (err, box) => {
      if (err) throw err;
      imap.search(['UNSEEN'], (err, results) => {
        if (results.length === 0) return 'কোনো নতুন মেইল নেই';
        const fetch = imap.fetch(results[results.length - 1], { bodies: '' });
        fetch.on('message', (msg) => {
          msg.on('body', (stream) => {
            // মেইল বডি পার্স করে লিঙ্ক বের করো (re দিয়ে)
            stream.on('data', (chunk) => {
              const body = chunk.toString();
              const link = body.match(/https?:\/\/[^\s<>"']+/g)?.find(l => l.includes('verify'));
              if (link) {
                document.getElementById('result').innerHTML = `আসল লিঙ্ক: <a href="\( {link}"> \){link}</a>`;
              }
            });
          });
        });
      });
      imap.end();
    });
  });
}

// বাটনে ক্লিক করলে ইনপুট নাও
document.getElementById('checkBtn').onclick = () => {
  const email = prompt('Outlook ইমেইল দাও');
  const pass = prompt('App Password দাও');
  checkTNMail(email, pass);
};
