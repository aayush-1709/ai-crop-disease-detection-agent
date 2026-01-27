document.addEventListener('DOMContentLoaded', () => {
  const emergencyBtn = document.getElementById('emergencyBtn');
  const emergencyBtnMobile = document.getElementById('emergencyBtnMobile');
  const emergencyModal = document.getElementById('emergencyModal');
  const closeEmergency = document.getElementById('closeEmergency');
  const emergencyForm = document.getElementById('emergencyForm');
  const emergencySuccess = document.getElementById('emergencySuccess');
  const userImage = document.getElementById('userImage');
  const emergencySubmitBtn = document.getElementById('emergencySubmitBtn');

  // If this page doesn't have the modal, don't wire anything.
  if (!emergencyModal || !emergencyForm) return;

  function openEmergencyModal(e) {
    e?.preventDefault?.();
    emergencySuccess?.classList.add('hidden');
    emergencyModal.classList.remove('hidden');
  }

  function closeEmergencyModal() {
    emergencyModal.classList.add('hidden');
    emergencyForm.reset();
    emergencySuccess?.classList.add('hidden');
  }

  emergencyBtn?.addEventListener('click', openEmergencyModal);
  emergencyBtnMobile?.addEventListener('click', openEmergencyModal);
  closeEmergency?.addEventListener('click', closeEmergencyModal);

  // Click outside the card closes modal
  emergencyModal.addEventListener('click', (e) => {
    if (e.target === emergencyModal) closeEmergencyModal();
  });

  emergencyForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (userImage?.files?.length > 0) {
      const fileSizeMB = userImage.files[0].size / 1024 / 1024;
      if (fileSizeMB > 2) {
        alert('Image size must be less than 2 MB');
        return;
      }
    }

    const formData = new FormData(emergencyForm);

    if (emergencySubmitBtn) {
      emergencySubmitBtn.disabled = true;
      emergencySubmitBtn.textContent = 'Submitting...';
    }

    try {
      const res = await fetch('/emergency', { method: 'POST', body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to submit emergency request');

      emergencySuccess?.classList.remove('hidden');
      emergencyForm.reset();
    } catch (err) {
      console.error(err);
      alert(err?.message || 'Failed to submit. Please try again.');
    } finally {
      if (emergencySubmitBtn) {
        emergencySubmitBtn.disabled = false;
        emergencySubmitBtn.textContent = 'Submit';
      }
    }
  });
});

