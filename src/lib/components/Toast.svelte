<script lang="ts">
  import { toastStore, type Toast } from '$lib/stores/toast';

  let toasts: Toast[] = [];
  toastStore.subscribe((val) => (toasts = val));
</script>

{#each toasts as toast (toast.id)}
  <div class="toast {toast.type}">
    <p>{toast.message}</p>
    <button class="close-btn" on:click={() => toastStore.removeToast(toast.id)}>×</button>
  </div>
{/each}

<style>
  .toast {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    padding: 1rem 1.5rem;
    border-radius: 4px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    min-width: 300px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    animation: slideIn 0.3s ease;
    z-index: 9999;
  }
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  .toast.success {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  }
  .toast.error {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }
  .toast.info {
    background: #d1ecf1;
    color: #0c5460;
    border: 1px solid #bee5eb;
  }
  p {
    margin: 0;
  }
  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: inherit;
    opacity: 0.7;
    transition: opacity 0.3s ease;
  }
  .close-btn:hover {
    opacity: 1;
  }
  @media (max-width: 640px) {
    .toast {
      min-width: auto;
      bottom: 1rem;
      right: 1rem;
      left: 1rem;
    }
  }
</style>
