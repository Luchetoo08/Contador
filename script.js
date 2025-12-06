document.addEventListener('DOMContentLoaded', () => {
    console.log('Script loaded and DOM ready');

    // --- Elements ---
    const inputSection = document.getElementById('input-section');
    const countdownSection = document.getElementById('countdown-section');

    // Inputs
    const eventNameInput = document.getElementById('event-name');
    const eventDateInput = document.getElementById('event-date');
    const fontStyleSelect = document.getElementById('font-style');
    const colorInput = document.getElementById('accent-color');

    // Mode Switcher
    const tabDate = document.getElementById('mode-date');
    const tabDuration = document.getElementById('mode-duration');
    const dateInputContainer = document.getElementById('date-input-container');
    const durationInputContainer = document.getElementById('duration-input-container');

    // Duration Inputs
    const durDays = document.getElementById('dur-days');
    const durHours = document.getElementById('dur-hours');
    const durMinutes = document.getElementById('dur-minutes');
    const durSeconds = document.getElementById('dur-seconds');

    // Controls
    const startBtn = document.getElementById('start-btn');
    const resetBtn = document.getElementById('reset-btn');
    const obsBtn = document.getElementById('obs-btn');
    const obsInfo = document.getElementById('obs-info');
    const obsUrlInput = document.getElementById('obs-url-input');
    const copyObsBtn = document.getElementById('copy-obs-btn');

    // Display Elements
    const displayEventName = document.getElementById('display-event-name');
    const displayMessage = document.getElementById('display-message');
    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');

    let countdownInterval;
    let currentMode = 'date'; // 'date' or 'duration'

    // --- Initialization ---

    // Set min date to current time
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    if (eventDateInput) {
        eventDateInput.min = now.toISOString().slice(0, 16);
    }

    // Check for URL params to restore state (or OBS mode)
    checkUrlParams();

    // --- Event Listeners ---

    // Mode Switching
    if (tabDate && tabDuration) {
        tabDate.addEventListener('click', () => switchMode('date'));
        tabDuration.addEventListener('click', () => switchMode('duration'));
    }

    // Color Picker - Immediate Update
    if (colorInput) {
        colorInput.addEventListener('input', (e) => {
            updateThemeColor(e.target.value);
        });
    }

    // Start Countdown
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            const eventName = eventNameInput.value.trim() || 'Evento';
            const selectedFont = fontStyleSelect.value;
            const selectedColor = colorInput.value;

            let targetDateMs;

            if (currentMode === 'date') {
                const eventDateValue = eventDateInput.value;
                if (!eventDateValue) {
                    alert('Por favor, selecciona una fecha y hora.');
                    return;
                }
                targetDateMs = new Date(eventDateValue).getTime();
                if (targetDateMs <= Date.now()) {
                    alert('Por favor, selecciona una fecha en el futuro.');
                    return;
                }
            } else {
                // Duration Mode
                const d = parseInt(durDays.value) || 0;
                const h = parseInt(durHours.value) || 0;
                const m = parseInt(durMinutes.value) || 0;
                const s = parseInt(durSeconds.value) || 0;

                if (d === 0 && h === 0 && m === 0 && s === 0) {
                    alert('Por favor, ingresa una duración válida.');
                    return;
                }

                // Calculate target date based on current time + duration
                targetDateMs = Date.now() + ((d * 24 * 3600) + (h * 3600) + (m * 60) + s) * 1000;
            }

            // Start logic
            startCountdown({
                targetDate: targetDateMs,
                name: eventName,
                font: selectedFont,
                color: selectedColor
            });

            // Update URL to share/save state
            updateUrlState({
                target: targetDateMs,
                name: eventName,
                font: selectedFont,
                color: selectedColor
            });
        });
    }

    // Reset
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            clearInterval(countdownInterval);
            inputSection.style.display = 'block';
            countdownSection.style.display = 'none';
            // Clear URL params
            window.history.replaceState({}, document.title, window.location.pathname);

            document.title = "Contador Personalizado";
        });
    }

    // OBS Link Generation
    if (obsBtn) {
        obsBtn.addEventListener('click', () => {
            // Get current URL (which should be updated by startCountdown)
            const currentUrl = new URL(window.location.href);
            currentUrl.searchParams.set('obs', 'true');

            obsUrlInput.value = currentUrl.toString();
            obsInfo.style.display = 'block';
        });
    }

    if (copyObsBtn) {
        copyObsBtn.addEventListener('click', () => {
            obsUrlInput.select();
            document.execCommand('copy');
            const originalText = copyObsBtn.textContent;
            copyObsBtn.textContent = '¡Copiado!';
            setTimeout(() => copyObsBtn.textContent = originalText, 2000);
        });
    }

    // --- Functions ---

    function switchMode(mode) {
        currentMode = mode;
        if (mode === 'date') {
            tabDate.classList.add('active');
            tabDuration.classList.remove('active');
            dateInputContainer.style.display = 'block';
            durationInputContainer.style.display = 'none';
        } else {
            tabDuration.classList.add('active');
            tabDate.classList.remove('active');
            dateInputContainer.style.display = 'none';
            durationInputContainer.style.display = 'flex'; // or flex/block depending on css
        }
    }

    function updateThemeColor(color) {
        document.documentElement.style.setProperty('--accent-primary', color);
        document.documentElement.style.setProperty('--text-primary', color);
        // Ensure UI elements update if needed, though variable change handles most
    }

    function startCountdown(config) {
        const { targetDate, name, font, color } = config;

        // Apply settings
        displayEventName.textContent = name;
        displayEventName.style.fontFamily = font;
        countdownSection.style.fontFamily = font;
        document.querySelectorAll('.number').forEach(el => el.style.fontFamily = font);

        if (color) {
            updateThemeColor(color);
            // Also update input if coming from URL
            if (colorInput) colorInput.value = color;
        }

        // Show sections
        inputSection.style.display = 'none';
        countdownSection.style.display = 'block';

        // Start timer
        clearInterval(countdownInterval);
        updateTimer(targetDate); // immediate update
        countdownInterval = setInterval(() => {
            updateTimer(targetDate);
        }, 1000);
    }

    function updateTimer(targetDate) {
        const now = new Date().getTime();
        const distance = targetDate - now;

        if (distance < 0) {
            clearInterval(countdownInterval);
            timeIsUp();
            return;
        }

        // Calculations
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        // Render
        daysEl.textContent = formatTime(days);
        hoursEl.textContent = formatTime(hours);
        minutesEl.textContent = formatTime(minutes);
        secondsEl.textContent = formatTime(seconds);

        // Update title with time for browser tab visibility
        document.title = `${formatTime(hours)}:${formatTime(minutes)}:${formatTime(seconds)} - ${displayEventName.textContent}`;
    }

    function timeIsUp() {
        daysEl.textContent = '00';
        hoursEl.textContent = '00';
        minutesEl.textContent = '00';
        secondsEl.textContent = '00';
        displayMessage.textContent = '¡El momento ha llegado!';
        displayMessage.style.color = 'var(--accent-primary)';
        document.title = "¡Tiempo Terminado!";
    }

    function formatTime(time) {
        return time < 10 ? `0${time}` : time;
    }

    function updateUrlState(params) {
        const url = new URL(window.location.href);
        url.searchParams.set('target', params.target);
        url.searchParams.set('name', params.name);
        url.searchParams.set('font', params.font);
        url.searchParams.set('color', params.color);
        window.history.replaceState({}, '', url);
    }

    function checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const target = urlParams.get('target');
        const name = urlParams.get('name');
        const font = urlParams.get('font');
        const color = urlParams.get('color');
        const isObs = urlParams.get('obs') === 'true';

        if (isObs) {
            document.body.classList.add('obs-mode');
        }

        if (target && name) {
            startCountdown({
                targetDate: parseInt(target),
                name: name,
                font: font || "'Orbitron', sans-serif",
                color: color || '#FF8C00'
            });
        }
    }
});
