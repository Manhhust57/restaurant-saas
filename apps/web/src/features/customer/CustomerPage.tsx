import styles from './CustomerPage.module.css';
import { useEffect, useRef, useState } from 'react';
import { getMenu, submitOrder as submitOrderRequest } from './customer.api';
import { useSearchParams } from 'react-router-dom';
import type { MenuResponse, Product } from './customer.types';
import ProductImage from '../../shared/components/ProductImage';
import { clearCart, loadCart, saveCart } from './cartStorage';
export default function CustomerPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? 'qr-b1';
  const [menu, setMenu] = useState<MenuResponse | null>(null);
  const [cart, setCart] = useState<Record<string, number>>(() => loadCart(token));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const sendingRef = useRef(false);
  const cartDialog = useRef<HTMLDialogElement>(null);
  const productDialog = useRef<HTMLDialogElement>(null);
  const categoryNav = useRef<HTMLElement>(null);
  const [categoryEdges, setCategoryEdges] = useState({ left: false, right: false });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  function openProduct(product: Product) {
    setSelectedProduct(product);
    productDialog.current?.showModal();
  }

  useEffect(() => {
    const nav = categoryNav.current;
    if (!nav) return;
    function updateEdges() {
      const current = categoryNav.current;
      if (!current) return;
      const hidden = current.scrollWidth - current.clientWidth;
      setCategoryEdges({
        left: current.scrollLeft > 8,
        right: hidden - current.scrollLeft > 8,
      });
    }
    updateEdges();
    nav.addEventListener('scroll', updateEdges, { passive: true });
    const observer = new ResizeObserver(updateEdges);
    observer.observe(nav);
    return () => {
      nav.removeEventListener('scroll', updateEdges);
      observer.disconnect();
    };
  }, [menu]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setMenu(null);
    setCart(loadCart(token));
    setSubmitted(false);
    setError('');
    getMenu(token)
      .then((data) => {
        if (!cancelled) {
          setMenu(data);
          setError('');
        }
      })
      .catch((requestError: Error) => {
        if (!cancelled) {
          setError(requestError.message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    saveCart(token, cart);
  }, [token, cart]);

  const products = menu?.categories.flatMap((category) => category.products) ?? [];
  const cartItems = products
    .filter((product) => cart[product.id])
    .map((product) => ({ product, quantity: cart[product.id] }));
  const total = cartItems.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0,
  );
  const quantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  function addToCart(productId: string) {
    if (sendingRef.current) return;
    setCart((current) => ({ ...current, [productId]: (current[productId] ?? 0) + 1 }));
    setSubmitted(false);
  }

  function removeFromCart(productId: string) {
    if (sendingRef.current) return;
    setCart((current) => {
      const quantity = (current[productId] ?? 0) - 1;
      if (quantity <= 0) {
        const next = { ...current };
        delete next[productId];
        return next;
      }
      return { ...current, [productId]: quantity };
    });
  }

  async function submitOrder() {
    if (!cartItems.length || sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    setError('');

    try {
      await submitOrderRequest(
        token,
        cartItems.map(({ product, quantity }) => ({ productId: product.id, quantity })),
      );
      clearCart(token);
      setCart({});
      setSubmitted(true);
      setError('');
      cartDialog.current?.close();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không gửi được order.');
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }

  if (loading)
    return (
      <section className={'card'}>
        <p>Đang tải menu...</p>
      </section>
    );
  if (error && !menu)
    return (
      <section className={'card'}>
        <p className={'error'}>{error}</p>
      </section>
    );
  if (!menu) return null;

  return (
    <section className={styles['customer-page']}>
      <header className={styles.header}>
        <div>
          <p className={'eyebrow'}>{menu.table.tenant.name}</p>
          <h2>{menu.table.name}</h2>
        </div>
        <span className={styles['table-badge']}>Chọn món</span>
      </header>

      {submitted && (
        <div className={'success'} role="status">
          Đã gửi yêu cầu gọi món. Vui lòng chờ nhân viên xác nhận.
        </div>
      )}
      {error && <div className={'error'}>{error}</div>}

      <div className={styles.categoryBar}>
        <nav ref={categoryNav} className={styles.categories} aria-label="Danh mục món">
          {menu.categories.map((category) => (
            <a key={category.id} href={`#category-${category.id}`}>
              {category.name}
            </a>
          ))}
        </nav>
        {categoryEdges.left && (
          <span className={styles.hintLeft} aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M14 6 L8 12 L14 18" /></svg>
          </span>
        )}
        {categoryEdges.right && (
          <span className={styles.hintRight} aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M10 6 L16 12 L10 18" /></svg>
          </span>
        )}
      </div>
      {!products.length && <p>Quán chưa có món để đặt.</p>}
      <div className={styles['menu-layout']}>
        <div className={'menu-list'}>
          {menu.categories.map((category) => (
            <section
              className={styles['menu-category']}
              id={`category-${category.id}`}
              key={category.id}
            >
              <h3>{category.name}</h3>
              <div className={styles.productGrid}>
              {category.products.map((product, productIndex) => (
                <article className={styles['menu-item']} key={product.id}>
                  <button className={styles.foodImage} type="button" aria-label={`Xem chi tiết ${product.name}`} onClick={() => openProduct(product)}>
                    <ProductImage src={product.imageUrl} name={product.name} priority={menu.categories[0]?.id === category.id && productIndex < 2} />
                  </button>
                  <div className={styles['menu-details']}>
                    <h4>{product.name}</h4>
                    <strong>{Number(product.price).toLocaleString('vi-VN')} đ</strong>
                  </div>
                  <button
                    type="button"
                    disabled={sending}
                    aria-label={`Thêm ${product.name}`}
                    onClick={() => addToCart(product.id)}
                  >
                    Thêm{cart[product.id] ? ` (${cart[product.id]})` : ''}
                  </button>
                </article>
              ))}
              </div>
            </section>
          ))}
        </div>

        <dialog ref={productDialog} className={styles.productDialog} aria-labelledby="product-title" onClose={() => setSelectedProduct(null)}>
          <div className={styles.cartHeader}>
            <h3 id="product-title">{selectedProduct?.name ?? 'Chi tiết món'}</h3>
            <button type="button" onClick={() => productDialog.current?.close()} aria-label="Đóng chi tiết món">Đóng</button>
          </div>
          {selectedProduct && <>
            <div className={styles.largeImage}><ProductImage src={selectedProduct.imageUrl} name={selectedProduct.name} variant="detail" priority /></div>
            <strong>{Number(selectedProduct.price).toLocaleString('vi-VN')} đ</strong>
            <p className={styles.productDescription}>{selectedProduct.description || 'Món này chưa có mô tả.'}</p>
          </>}
        </dialog>

        <dialog ref={cartDialog} className={styles['cart-panel']} aria-labelledby="cart-title">
          <div className={styles.cartHeader}>
            <h3 id="cart-title">Giỏ món · {menu.table.name}</h3>
            <button
              type="button"
              onClick={() => cartDialog.current?.close()}
              aria-label="Đóng giỏ món"
            >
              Đóng
            </button>
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {!cartItems.length && <p>Chưa có món nào.</p>}
          {cartItems.map(({ product, quantity }) => (
            <div className={styles['cart-item']} key={product.id}>
              <div className={styles['cart-thumb']}>
                <ProductImage src={product.imageUrl} name={product.name} />
              </div>
              <div className={styles['cart-info']}>
                <span>{product.name}</span>
                <small>{(Number(product.price) * quantity).toLocaleString('vi-VN')} đ</small>
              </div>
              <div className={styles['cart-qty']}>
                <button
                  type="button"
                  disabled={sending}
                  onClick={() => removeFromCart(product.id)}
                  aria-label={`Bớt ${product.name}`}
                >
                  −
                </button>
                <b>{quantity}</b>
                <button
                  type="button"
                  disabled={sending}
                  onClick={() => addToCart(product.id)}
                  aria-label={`Thêm ${product.name}`}
                >
                  +
                </button>
              </div>
            </div>
          ))}
          <div className={styles['cart-total']}>
            <span>Tạm tính</span>
            <strong>{total.toLocaleString('vi-VN')} đ</strong>
          </div>
          <button
            className={styles['submit-button']}
            type="button"
            disabled={!cartItems.length || sending}
            onClick={submitOrder}
          >
            {sending ? 'Đang gửi…' : 'Gửi yêu cầu gọi món'}
          </button>
        </dialog>
      </div>
      <footer className={styles.cartBar}>
        <div>
          <strong>
            {quantity} món · {total.toLocaleString('vi-VN')} đ
          </strong>
          <small>{quantity ? 'Kiểm tra món trước khi gửi' : 'Chọn món để bắt đầu'}</small>
        </div>
        <button type="button" disabled={!quantity} onClick={() => cartDialog.current?.showModal()}>
          Xem giỏ
        </button>
      </footer>
    </section>
  );
}
