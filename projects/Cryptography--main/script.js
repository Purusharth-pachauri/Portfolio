document.addEventListener('DOMContentLoaded', () => {
    
    // --- UI Logic (Tabs) ---
    const tabEncrypt = document.getElementById('tab-encrypt');
    const tabDecrypt = document.getElementById('tab-decrypt');
    const secEncrypt = document.getElementById('encrypt-section');
    const secDecrypt = document.getElementById('decrypt-section');

    tabEncrypt.addEventListener('click', () => {
        tabEncrypt.classList.add('active');
        tabDecrypt.classList.remove('active');
        secEncrypt.classList.add('active-section');
        secDecrypt.classList.remove('active-section');
    });

    tabDecrypt.addEventListener('click', () => {
        tabDecrypt.classList.add('active');
        tabEncrypt.classList.remove('active');
        secDecrypt.classList.add('active-section');
        secEncrypt.classList.remove('active-section');
    });

    // Provide visual feedback for all file inputs
    document.querySelectorAll('.file-drop-area input[type="file"]').forEach(input => {
        input.addEventListener('change', (e) => {
            const p = e.target.parentElement.querySelector('p');
            if(e.target.files.length > 0) {
                p.innerHTML = `<strong>Selected:</strong> ${e.target.files[0].name}`;
            }
        });
    });

    // --- Cryptography Helpers ---
    function arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }

    function base64ToArrayBuffer(base64) {
        const binary_string = window.atob(base64);
        const len = binary_string.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binary_string.charCodeAt(i);
        }
        return bytes.buffer;
    }

    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // --- Encrypt Form Submit ---
    document.getElementById('encrypt-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const status = document.getElementById('encrypt-status');
        const fileInput = document.getElementById('file-to-encrypt');
        
        if(fileInput.files.length === 0) return;
        const file = fileInput.files[0];

        try {
            status.className = 'status-msg';
            status.innerText = "Generating key & encrypting securely...";
            
            // 1. Generate AES-GCM Key (256-bit)
            const key = await window.crypto.subtle.generateKey(
                { name: "AES-GCM", length: 256 },
                true,
                ["encrypt", "decrypt"]
            );

            // 2. Export key as Raw buffer, then Base64 encode it for saving as Secret.key
            const rawKeyBuffer = await window.crypto.subtle.exportKey("raw", key);
            const keyBase64 = arrayBufferToBase64(rawKeyBuffer);
            
            // 3. Read the target file
            const fileBuffer = await file.arrayBuffer();

            // 4. Generate random Initialization Vector (12 bytes for AES-GCM)
            const iv = window.crypto.getRandomValues(new Uint8Array(12));

            // 5. Encrypt
            const encryptedContent = await window.crypto.subtle.encrypt(
                { name: "AES-GCM", iv: iv },
                key,
                fileBuffer
            );

            // 6. Combine IV + Encrypted Data
            // We append the 12-byte IV exactly at the start of the payload
            const encryptedPayload = new Uint8Array(iv.byteLength + encryptedContent.byteLength);
            encryptedPayload.set(iv, 0);
            encryptedPayload.set(new Uint8Array(encryptedContent), iv.byteLength);

            // 7. Trigger downloads
            const encryptedBlob = new Blob([encryptedPayload], {type: "application/octet-stream"});
            downloadBlob(encryptedBlob, file.name + ".enc");

            // Give a slight delay before downloading the key so browser doesn't block multiple popups
            setTimeout(() => {
                const keyBlob = new Blob([keyBase64], {type: "text/plain"});
                downloadBlob(keyBlob, "Secret.key");
                status.innerText = "Encryption complete! Both file and Secret.key downloaded.";
                fileInput.value = ""; // reset
                fileInput.parentElement.querySelector('p').innerText = "Drag & Drop a file here or";
            }, 500);

        } catch(error) {
            console.error(error);
            status.className = 'status-msg error';
            status.innerText = "Encryption failed! See console for details.";
        }
    });

    // --- Decrypt Form Submit ---
    document.getElementById('decrypt-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const status = document.getElementById('decrypt-status');
        const fileInput = document.getElementById('file-to-decrypt');
        const keyInput = document.getElementById('secret-key-file');
        
        if(fileInput.files.length === 0 || keyInput.files.length === 0) return;
        const file = fileInput.files[0];
        const keyFile = keyInput.files[0];

        try {
            status.className = 'status-msg';
            status.innerText = "Decrypting and restoring file...";

            // 1. Read Secret.key file
            const keyText = await keyFile.text();
            let rawKeyBuffer;
            try {
                rawKeyBuffer = base64ToArrayBuffer(keyText.trim());
            } catch(e) {
                throw new Error("Invalid Secret.key format.");
            }

            // 2. Import Key
            const key = await window.crypto.subtle.importKey(
                "raw",
                rawKeyBuffer,
                { name: "AES-GCM" },
                false,
                ["decrypt"]
            );

            // 3. Read encrypted .enc file payload
            const encryptedFileData = await file.arrayBuffer();
            
            // 4. Extract IV (first 12 bytes) and ciphertext (rest)
            const iv = encryptedFileData.slice(0, 12);
            const ciphertext = encryptedFileData.slice(12);

            // 5. Decrypt
            const decryptedContent = await window.crypto.subtle.decrypt(
                { name: "AES-GCM", iv: iv },
                key,
                ciphertext
            );

            // 6. Figure out original filename by stipping .enc if it exists
            let originalName = file.name;
            if(originalName.endsWith('.enc')) {
                originalName = originalName.slice(0, -4);
            } else {
                originalName = "decrypted_" + originalName;
            }

            // 7. Download original
            const decryptedBlob = new Blob([decryptedContent]);
            downloadBlob(decryptedBlob, originalName);

            status.innerText = "Decryption successful! Restored file downloaded.";
            
            // Reset
            fileInput.value = "";
            fileInput.parentElement.querySelector('p').innerText = "Select Encrypted File (.enc)";
            keyInput.value = "";
            keyInput.parentElement.querySelector('p').innerText = "Select Secret.key File";

        } catch(error) {
            console.error(error);
            status.className = 'status-msg error';
            status.innerText = "Decryption failed. Incorrect file or wrong Secret.key provided!";
        }
    });

});
