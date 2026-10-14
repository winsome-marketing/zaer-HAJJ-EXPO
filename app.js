(() => {
  'use strict';
  const header = document.getElementById('header');
  const bookingSection = document.getElementById('book');
  const formCard = document.getElementById('formCard');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const tracking = (eventName, data = {}) => {
    // Optional GA4/GTM hook. No external analytics integration is installed.
    if (Array.isArray(window.dataLayer)) window.dataLayer.push({ event: eventName, ...data });
  };

  const updateHeader = () => header?.classList.toggle('scrolled', window.scrollY > 30);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  document.querySelectorAll('a.js-book').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (!bookingSection) return;
      event.preventDefault();
      tracking('book_meeting_click', { cta_location: link.closest('section')?.id || 'header_or_mobile' });
      bookingSection.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
      if (history.replaceState) history.replaceState(null, '', '#book');
      formCard?.classList.add('flash');
      window.setTimeout(() => formCard?.classList.remove('flash'), 1500);
    });
  });

  const view = document.getElementById('clientsMarquee');
  const track = document.getElementById('clientTrack');
  if (view && track) {
    const original = [...track.children];
    original.forEach((tile) => {
      const duplicate = tile.cloneNode(true);
      duplicate.setAttribute('aria-hidden', 'true');
      duplicate.querySelector('img')?.setAttribute('alt', '');
      track.appendChild(duplicate);
    });
    const setMarqueeDistance = () => {
      if (track.children[original.length]) {
        // Bounding rect calculation compensates for animations by using offsetLeft.
        const distance = track.children[original.length].offsetLeft - original[0].offsetLeft;
        track.style.setProperty('--marquee-distance', `${Math.round(distance)}px`);
      }
    };
    setMarqueeDistance();
    window.addEventListener('resize', setMarqueeDistance, { passive: true });
  }

  const form = document.getElementById('meetingForm');
  const countryInput = document.getElementById('country');
  const countries = new Set([...document.querySelectorAll('#countryOptions option')].map(option => option.value.toLocaleLowerCase()));
  const checkCountry = () => {
    if (!countryInput) return;
    const value = countryInput.value.trim();
    countryInput.setCustomValidity(!value ? '' : countries.has(value.toLocaleLowerCase()) ? '' : 'Please choose a country from the suggestions.');
  };
  countryInput?.addEventListener('input', checkCountry);
  countryInput?.addEventListener('change', checkCountry);
  const status = document.getElementById('formStatus');
  const fallback = document.getElementById('formFallback');
  const emailLink = document.getElementById('preparedEmail');
  const copyButton = document.getElementById('copyRequest');
  let latestBody = '';
  if (form) {
    let started = false;
    form.addEventListener('input', () => {
      if (!started) { started = true; tracking('form_start'); }
    }, { passive: true });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      checkCountry();
      form.querySelectorAll('.invalid').forEach((el) => el.classList.remove('invalid'));
      if (!form.checkValidity()) {
        const invalid = form.querySelector(':invalid');
        invalid?.classList.add('invalid');
        invalid?.focus();
        form.reportValidity();
        tracking('form_error', { reason: 'required_field_or_invalid_email' });
        return;
      }
      const data = Object.fromEntries(new FormData(form).entries());
      const subject = `Hajj Expo 2026 - Meeting Request - ${data.company}`;
      latestBody = [
        'Hello ZAER Team,', '',
        'I would like to request a meeting at Hajj Expo 2026.', '',
        `Full name: ${data.fullName}`,
        `Company: ${data.company}`,
        `Business email: ${data.email}`,
        `Phone / WhatsApp: ${data.phone}`,
        `Country: ${data.country}`,
        `Preferred language: ${data.language || 'Not specified'}`,
        `Service: ${data.service || 'Not specified'}`,
        `Notes: ${data.notes || 'Not specified'}`,
        'Location: Jeddah Super Dome', '',
        'Please contact me to confirm a meeting.'
      ].join('\n');
      const url = `mailto:test@zaer.sa?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(latestBody)}`;
      emailLink.href = url;
      status.textContent = 'Your email app should open with a prepared message. Please send that email to ZAER to complete your request. This is not a confirmed booking.';
      status.hidden = false;
      fallback.hidden = false;
      tracking('meeting_email_prepared', { service_interest: data.service });
      window.location.href = url;
    });
  }
  copyButton?.addEventListener('click', async () => {
    if (!latestBody) return;
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(latestBody);
      else {
        const ta = document.createElement('textarea');ta.value = latestBody;document.body.append(ta);ta.select();document.execCommand('copy');ta.remove();
      }
      copyButton.textContent = 'Copied';
    } catch (_) {
      copyButton.textContent = 'Please select and copy the email text';
    }
  });
})();
