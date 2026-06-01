async function test() {
  try {
    const res = await fetch('http://localhost:5000/api/detection/symptom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symptoms: ['Yellow Leaves'] })
    });
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Success:", data);
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
