import fetch from 'node-fetch';
async function run() {
  try {
    const res = await fetch('http://localhost:3001/api/gamification/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        enableBirthdays: true,
        enableWinBacks: true,
        enableReferrals: true,
        pointsPerCurrency: 1,
        signupDiscountValue: 0,
        referralRewardValue: 0
      })
    });
    console.log(res.status, await res.text());
  } catch (e) {
    console.error(e);
  }
}
run();
