document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('predict-form');
    const inputArea = document.getElementById('feature-input');
    const loadSampleBtn = document.getElementById('load-sample-btn');
    const resultDisplay = document.getElementById('result-display');
    const statusIcon = document.getElementById('status-icon');
    const resultLabel = document.getElementById('result-label');
    const resultConfidence = document.getElementById('result-confidence');

    // Sample attack from NSL-KDD (e.g. neptune SYN flood params roughly)
    const sampleAttack = {
        "duration": 0, "protocol_type": "tcp", "service": "private", "flag": "S0",
        "src_bytes": 0, "dst_bytes": 0, "land": 0, "wrong_fragment": 0, "urgent": 0,
        "hot": 0, "num_failed_logins": 0, "logged_in": 0, "num_compromised": 0,
        "root_shell": 0, "su_attempted": 0, "num_root": 0, "num_file_creations": 0,
        "num_shells": 0, "num_access_files": 0, "num_outbound_cmds": 0, "is_host_login": 0,
        "is_guest_login": 0, "count": 123, "srv_count": 6, "serror_rate": 1.0, 
        "srv_serror_rate": 1.0, "rerror_rate": 0.0, "srv_rerror_rate": 0.0,
        "same_srv_rate": 0.05, "diff_srv_rate": 0.07, "srv_diff_host_rate": 0.0,
        "dst_host_count": 255, "dst_host_srv_count": 26, "dst_host_same_srv_rate": 0.1,
        "dst_host_diff_srv_rate": 0.05, "dst_host_same_src_port_rate": 0.0,
        "dst_host_srv_diff_host_rate": 0.0, "dst_host_serror_rate": 1.0, 
        "dst_host_srv_serror_rate": 1.0, "dst_host_rerror_rate": 0.0, "dst_host_srv_rerror_rate": 0.0
    };

    loadSampleBtn.addEventListener('click', () => {
        inputArea.value = JSON.stringify(sampleAttack, null, 2);
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        let data;
        try {
            data = JSON.parse(inputArea.value);
        } catch(err) {
            alert('Invalid JSON! Please check your input formatting.');
            return;
        }

        // Reset UI
        resultDisplay.className = 'result-display';
        statusIcon.textContent = '🔄';
        resultLabel.textContent = 'Analyzing...';
        resultConfidence.textContent = '';

        try {
            const response = await fetch('http://127.0.0.1:5000/api/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            // Handle potential non-JSON error responses (like 500 internal server error page)
            let resData;
            try {
                resData = await response.json();
            } catch (e) {
                throw new Error("Received invalid response from server. Check Python terminal for errors.");
            }

            if (!response.ok) {
                throw new Error(resData.error || 'Server error');
            }

            if (resData.is_attack) {
                resultDisplay.classList.add('attack');
                statusIcon.textContent = '⚠️';
                resultLabel.textContent = 'INTRUSION DETECTED';
            } else {
                resultDisplay.classList.add('normal');
                statusIcon.textContent = '✅';
                resultLabel.textContent = 'NORMAL TRAFFIC';
            }

            if (resData.confidence !== null) {
                resultConfidence.textContent = `Confidence: ${(resData.confidence * 100).toFixed(2)}%`;
            }

        } catch(err) {
            resultDisplay.className = 'result-display';
            statusIcon.textContent = '❌';
            resultLabel.textContent = 'Error';
            resultConfidence.textContent = err.message + ' (Make sure you are running "python app.py" in your terminal first!)';
        }
    });
});
