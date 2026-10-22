export function showToast(message, type = 'success') {
  window.dispatchEvent(new CustomEvent('odyssey-toast', {
    detail: { message, type },
  }))
}
