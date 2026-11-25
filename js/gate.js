const AccessGate = {
  onSuccessCallback: null,

  init() {
    this.modal = document.getElementById('gate-modal');
    this.modal = document.getElementById('gate-modal');
    this.card = this.modal.querySelector('.gate-card');
    this.title = document.getElementById('gate-title');
    this.desc = document.getElementById('gate-desc');
    this.input = document.getElementById('gate-input');
    this.submitBtn = document.getElementById('gate-submit-btn');
    this.closeBtn = document.getElementById('close-gate-btn');
    this.errorEl = document.getElementById('gate-error');

    this.submitBtn.addEventListener('click', () => this.handleVerify());
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.handleVerify();
    });
    this.closeBtn.addEventListener('click', () => {
      if (!this.isPermaBanned()) {
        this.modal.classList.add('hidden');
      }
    });

    if (this.isPermaBanned() || this.isLockedOut()) {
      this.open();
    }
  },

  isUnlocked() {
    return !this.isPermaBanned() && localStorage.getItem('songz_gate_unlocked') === 'true';
  },

  isLockedOut() {
    return localStorage.getItem('songz_gate_locked') === 'true';
  },

  isPermaBanned() {
    return localStorage.getItem('songz_device_permabanned') === 'true';
  },

  getAttempts() {
    return Number(localStorage.getItem('songz_gate_attempts') || 0);
  },

  open(onSuccess = null) {
    this.onSuccessCallback = onSuccess;
    this.input.value = '';
    this.renderState();
    this.modal.classList.remove('hidden');
    if (!this.isPermaBanned()) {
      setTimeout(() => this.input.focus(), 50);
    }
  },

  renderState() {
    this.card.classList.remove('locked');
    this.errorEl.classList.add('hidden');

    if (this.isPermaBanned()) {
      this.card.classList.add('locked');
      this.closeBtn.classList.add('hidden');
      this.title.textContent = '⛔ DEVICE PERMANENTLY BANNED';
      this.desc.textContent = 'All password and recovery attempts failed. This device is permanently blocked from accessing SONGZ.';
      this.input.disabled = true;
      this.input.placeholder = 'ACCESS TERMINATED';
      this.submitBtn.disabled = true;
      this.submitBtn.style.opacity = '0.4';
      this.submitBtn.style.cursor = 'not-allowed';
      return;
    }

    if (this.isLockedOut()) {
      this.card.classList.add('locked');
      this.title.textContent = '⚠️ DEVICE LOCKED OUT';
      this.desc.textContent = 'Too many failed attempts. Enter the secondary recovery password below (1 chance remaining before permanent ban):';
      this.input.placeholder = 'Enter recovery password...';
      this.submitBtn.textContent = 'Recover';
      return;
    }

    const attemptsLeft = 3 - this.getAttempts();
    this.title.textContent = '🔒 Password Required';
    this.desc.textContent = `Enter the access password to connect to Spotify (${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} remaining):`;
    this.input.placeholder = 'Enter password...';
    this.submitBtn.textContent = 'Unlock';
  },

  handleVerify() {
    if (this.isPermaBanned()) return;

    const val = this.input.value.trim();
    if (!val) return;

    if (this.isLockedOut()) {
      if (val === CONFIG.RECOVERY_PASSWORD) {
        localStorage.removeItem('songz_gate_locked');
        localStorage.setItem('songz_gate_attempts', '0');
        localStorage.setItem('songz_gate_unlocked', 'true');
        this.modal.classList.add('hidden');
        if (this.onSuccessCallback) this.onSuccessCallback();
      } else {
        localStorage.setItem('songz_device_permabanned', 'true');
        localStorage.removeItem('songz_gate_unlocked');
        localStorage.removeItem('spotify_access_token');
        localStorage.removeItem('spotify_refresh_token');
        this.renderState();
      }
      return;
    }

    if (val === CONFIG.PRIMARY_PASSWORD) {
      localStorage.setItem('songz_gate_attempts', '0');
      localStorage.setItem('songz_gate_unlocked', 'true');
      this.modal.classList.add('hidden');
      if (this.onSuccessCallback) this.onSuccessCallback();
    } else {
      const nextAttempts = this.getAttempts() + 1;
      localStorage.setItem('songz_gate_attempts', String(nextAttempts));
      this.input.value = '';

      if (nextAttempts >= 3) {
        localStorage.setItem('songz_gate_locked', 'true');
        this.renderState();
      } else {
        const left = 3 - nextAttempts;
        this.renderState();
        this.errorEl.textContent = `Incorrect password. ${left} attempt${left === 1 ? '' : 's'} left before lockout.`;
        this.errorEl.classList.remove('hidden');
      }
    }
  }
};
