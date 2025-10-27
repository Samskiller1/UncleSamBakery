// --- Products (keep your existing list) ---
const products = [
  { id: 1, name: "Chocolate Cake", price: 1200, image: "images/chocolate-cake.jpg" },
  { id: 2, name: "Strawberry Shortcake", price: 1300, image: "images/strawberry-shortcake.jpg" },
  { id: 3, name: "Vanilla Sponge Cake", price: 1100, image: "images/vanilla-sponge.jpg" },
  { id: 4, name: "Red Velvet Cake", price: 1400, image: "images/red-velvet.jpg" },
  { id: 5, name: "Black Forest Cake", price: 1500, image: "images/black-forest.jpg" },
  { id: 6, name: "Banana Cake", price: 1000, image: "images/banana-cake.jpg" },
  { id: 7, name: "Plain Cake", price: 800, image: "images/plain-cake.jpg" },
  { id: 8, name: "Special Cake", price: 2100, image: "images/special-cake.jpg" },
  { id: 9, name: "Mega Cake", price: 1500, image: "images/mega-cake.jpg" }
];

// --- Cart stored in localStorage ---
function getCart() {
  return JSON.parse(localStorage.getItem('cart')) || [];
}
function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
}
function updateCartCount() {
  const countEl = document.getElementById('cart-count');
  const cart = getCart();
  if (countEl) countEl.textContent = cart.reduce((s, i) => s + (i.qty || 1), 0);
}

// --- Add to cart (used on product pages) ---
function addToCart(id) {
  const item = products.find(p => p.id === id);
  if (!item) return;
  const cart = getCart();
  const existing = cart.find(c => c.id === id);
  if (existing) {
    existing.qty = (existing.qty || 1) + 1;
  } else {
    cart.push({ id: item.id, name: item.name, price: item.price, qty: 1 });
  }
  saveCart(cart);
  // update loyalty points in localStorage
  const pts = parseInt(localStorage.getItem('loyaltyPoints') || '0', 10) + 10;
  localStorage.setItem('loyaltyPoints', pts);
  const pc = document.getElementById('point-count');
  if (pc) pc.textContent = pts;
  alert(`${item.name} added to cart. You earned 10 points!`);
}

// --- Render cart page ---
function renderCart() {
  const list = document.getElementById('cart-items');
  const subtotalEl = document.getElementById('cart-subtotal');
  if (!list) return;
  const cart = getCart();
  list.innerHTML = '';
  let subtotal = 0;
  cart.forEach((item, index) => {
    subtotal += item.price * (item.qty || 1);
    const li = document.createElement('li');
    li.className = 'cart-item';
    li.innerHTML = `
      <div class="item-row">
        <div class="item-info">
          <strong class="item-name">${item.name}</strong>
          <div class="item-price">KES ${item.price} × 
            <input type="number" class="item-qty" min="1" value="${item.qty || 1}" data-index="${index}" />
            = <span class="item-line">KES ${item.price * (item.qty || 1)}</span>
          </div>
        </div>
        <div class="item-actions">
          <button class="remove-item" data-index="${index}">Remove</button>
        </div>
      </div>
    `;
    list.appendChild(li);
  });
  if (subtotalEl) subtotalEl.textContent = subtotal;
  attachCartListeners();
  updateCartCount();
}

// --- Attach listeners for qty change and remove ---
function attachCartListeners() {
  // qty inputs
  document.querySelectorAll('.item-qty').forEach(input => {
    input.removeEventListener('change', onQtyChange);
    input.addEventListener('change', onQtyChange);
  });
  // remove buttons
  document.querySelectorAll('.remove-item').forEach(btn => {
    btn.removeEventListener('click', onRemoveClick);
    btn.addEventListener('click', onRemoveClick);
  });
}

function onQtyChange(e) {
  const index = parseInt(e.target.dataset.index, 10);
  const newQty = Math.max(1, parseInt(e.target.value, 10) || 1);
  const cart = getCart();
  if (!cart[index]) return;
  cart[index].qty = newQty;
  saveCart(cart);
  // update line and subtotal
  const line = e.target.closest('.item-row').querySelector('.item-line');
  line.textContent = `KES ${cart[index].price * cart[index].qty}`;
  const subtotalEl = document.getElementById('cart-subtotal');
  if (subtotalEl) {
    const subtotal = cart.reduce((s, i) => s + i.price * (i.qty || 1), 0);
    subtotalEl.textContent = subtotal;
  }
  updateCartCount();
}

function onRemoveClick(e) {
  const index = parseInt(e.target.dataset.index, 10);
  const cart = getCart();
  if (typeof index !== 'number') return;
  cart.splice(index, 1);
  saveCart(cart);
  renderCart();
}

// --- Clear cart button ---
document.addEventListener('click', function(e) {
  if (e.target && e.target.id === 'clear-cart') {
    localStorage.removeItem('cart');
    renderCart();
  }
});

// --- Checkout: place order to backend (sends cart contents) ---
document.addEventListener('click', function(e) {
  if (e.target && e.target.id === 'place-order') {
    const cart = getCart();
    if (!cart.length) {
      alert('Your cart is empty');
      return;
    }
    fetch('http://localhost:3000/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: cart })
    })
    .then(res => res.json())
    .then(data => {
      alert('Order placed! Your ID: ' + data.id);
      localStorage.removeItem('cart');
      renderCart();
    })
    .catch(err => {
      console.error(err);
      alert('Could not place order. Try again later.');
    });
  }
});

// --- M-Pesa payment from cart page ---
document.getElementById('mpesa-form')?.addEventListener('submit', function(e) {
  e.preventDefault();
  const form = new FormData(e.target);
  const phone = form.get('phone');
  const amount = form.get('amount');
  const mpesaMsg = document.getElementById('mpesa-msg');
  mpesaMsg.textContent = 'Initiating payment...';
  fetch('http://localhost:3000/pay', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, amount })
  })
  .then(res => res.json())
  .then(data => {
    mpesaMsg.textContent = 'Payment initiated. Check your phone to complete the STK push.';
  })
  .catch(err => {
    console.error(err);
    mpesaMsg.textContent = 'Payment failed to start. Try again later.';
  });
});

// --- Initialize product rendering on home page and loyalty display ---
function renderProducts() {
  const list = document.getElementById('product-list');
  if (!list) return;
  products.forEach(p => {
    const div = document.createElement('div');
    div.className = 'product';
    div.innerHTML = `
      <img src="${p.image}" alt="${p.name}" class="cake-img" />
      <h3>${p.name}</h3>
      <p>KES ${p.price}</p>
      <button class="add-to-cart" data-id="${p.id}">Add to Cart</button>
    `;
    list.appendChild(div);
  });
  // attach add-to-cart listeners
  document.querySelectorAll('.add-to-cart').forEach(btn => {
    btn.addEventListener('click', () => addToCart(parseInt(btn.dataset.id, 10)));
  });
}

// --- Support functions for other page actions (comments, custom cake, order status) ---
document.getElementById('cake-builder')?.addEventListener('submit', function(e) {
  e.preventDefault();
  const form = new FormData(e.target);
  fetch('http://localhost:3000/custom-cake', {
    method: 'POST',
    body: form
  })
  .then(res => res.json())
  .then(data => alert(data.message))
  .catch(()=> alert('Could not submit custom cake.'));
});

document.getElementById('comment-form')?.addEventListener('submit', function(e) {
  e.preventDefault();
  const name = e.target.name.value;
  const comment = e.target.comment.value;
  const li = document.createElement('li');
  li.innerHTML = `<strong>${name}:</strong> ${comment}`;
  document.getElementById('comment-list')?.appendChild(li);
  e.target.reset();
});

function checkStatus() {
  const id = document.getElementById('order-id')?.value;
  if (!id) return alert('Enter order ID');
  fetch(`http://localhost:3000/order-status/${id}`)
    .then(res => res.json())
    .then(data => {
      const el = document.getElementById('status-result');
      if (el) el.textContent = data.status;
    })
    .catch(()=> alert('Could not fetch status.'));
}

// --- Run initializers when DOM ready ---
document.addEventListener('DOMContentLoaded', function() {
  renderProducts();
  renderCart();
  updateCartCount();
  // show loyalty points if present
  const pts = localStorage.getItem('loyaltyPoints') || '0';
  const pc = document.getElementById('point-count');
  if (pc) pc.textContent = pts;
  // if cart page has mpesa amount field, set default to subtotal
  const subtotalEl = document.getElementById('cart-subtotal');
  const mpesaAmount = document.getElementById('mpesa-amount');
  if (subtotalEl && mpesaAmount) mpesaAmount.value = subtotalEl.textContent || '0';
});
