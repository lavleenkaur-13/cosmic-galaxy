// ═══════════════════════════════════════════════════════════════
// COSMIC GALAXY — SUPABASE BACKEND
// Include in ALL pages: <script src="cosmic-galaxy-backend.js"></script>
// ═══════════════════════════════════════════════════════════════

const SUPABASE_URL = 'https://ipwmihqwuslpogottinq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlwd21paHF3dXNscG9nb3R0aW5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5NzI0NzEsImV4cCI6MjA5MTU0ODQ3MX0.xHmlmv-zxm6GUWb6wC0hNhcclz0Mn-4RNw7RHe_cqDU';

let _sb = null;
function getSB() {
    if (!_sb) _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    return _sb;
}

// ═══════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════
const CG_Auth = {

    async signUp(firstName, lastName, email, password) {
        try {
            const { data, error } = await getSB().auth.signUp({
                email, password,
                options: { data: { first_name: firstName, last_name: lastName } }
            });
            if (error) throw error;
            if (data.user) {
                await getSB().from('profiles').insert({
                    id: data.user.id, first_name: firstName, last_name: lastName
                });
            }
            return { success: true, user: data.user };
        } catch (err) { return { success: false, error: err.message }; }
    },

    async logIn(email, password) {
        try {
            const { data, error } = await getSB().auth.signInWithPassword({ email, password });
            if (error) throw error;
            return { success: true, user: data.user };
        } catch (err) { return { success: false, error: err.message }; }
    },

    async logOut() {
        await getSB().auth.signOut();
        localStorage.removeItem('cg_cart');
        window.location.href = 'index.html';
    },

    async getUser() {
        const { data } = await getSB().auth.getUser();
        return data?.user || null;
    },

    async resetPassword(email) {
        try {
            const { error } = await getSB().auth.resetPasswordForEmail(email);
            if (error) throw error;
            return { success: true };
        } catch (err) { return { success: false, error: err.message }; }
    },

    async updateNav() {
        try {
            const user = await this.getUser();

            // Works with both id-based and href-based navbar buttons
            const loginBtn = document.getElementById('navLoginBtn')
                || document.querySelector('a[href="login.html"].btn-nav');
            const signupBtn = document.getElementById('navSignupBtn')
                || document.querySelector('a[href="signup.html"].btn-nav-primary');

            if (user && loginBtn && signupBtn) {
                const firstName = (user.user_metadata?.first_name || user.email.split('@')[0]).toUpperCase();

                // Show name → link to profile page
                loginBtn.textContent = firstName;
                loginBtn.href = 'profile.html';
                loginBtn.style.color = 'var(--earth-blue)';
                loginBtn.style.borderColor = 'rgba(74,144,226,.4)';

                // Sign Up → Logout button
                signupBtn.textContent = 'LOGOUT';
                signupBtn.href = '#';
                signupBtn.style.background = 'rgba(231,76,60,.12)';
                signupBtn.style.borderColor = 'rgba(231,76,60,.4)';
                signupBtn.style.color = '#e74c3c';
                signupBtn.onclick = (e) => {
                    e.preventDefault();
                    CG_Auth.logOut();
                };
            }
        } catch (e) { }
    }
};

// ═══════════════════════════════════════════════════════════════
// ORDERS
// ═══════════════════════════════════════════════════════════════
const CG_Orders = {

    async saveOrder(orderData) {
        try {
            const user = await CG_Auth.getUser();
            const orderId = 'CG' + Date.now().toString().slice(-7);
            const cart = JSON.parse(localStorage.getItem('cg_cart') || '[]');
            const { error } = await getSB().from('orders').insert({
                order_id: orderId, user_id: user?.id || null,
                customer_name: orderData.name, customer_email: orderData.email,
                customer_phone: orderData.phone, address: orderData.address,
                city: orderData.city, state: orderData.state, pin_code: orderData.pin,
                payment_method: orderData.paymentMethod, coupon_code: orderData.coupon || null,
                discount_amount: orderData.discount || 0, subtotal: orderData.subtotal,
                shipping: orderData.shipping, total: orderData.total,
                items: cart, status: 'pending'
            });
            if (error) throw error;
            localStorage.removeItem('cg_cart');
            return { success: true, orderId };
        } catch (err) {
            return { success: false, error: err.message };
        }
    },

    async getUserOrders() {
        try {
            const user = await CG_Auth.getUser();
            if (!user) return { success: false, error: 'Not logged in' };
            const { data, error } = await getSB().from('orders').select('*')
                .eq('user_id', user.id).order('created_at', { ascending: false });
            if (error) throw error;
            return { success: true, orders: data };
        } catch (err) { return { success: false, error: err.message }; }
    }
};

// ═══════════════════════════════════════════════════════════════
// CONTACT
// ═══════════════════════════════════════════════════════════════
const CG_Contact = {
    async sendMessage(formData) {
        try {
            const { error } = await getSB().from('contact_messages').insert({
                first_name: formData.firstName, last_name: formData.lastName,
                email: formData.email, order_id: formData.orderId || null,
                subject: formData.subject, message: formData.message, status: 'unread'
            });
            if (error) throw error;
            return { success: true };
        } catch (err) { return { success: false, error: err.message }; }
    }
};

// ═══════════════════════════════════════════════════════════════
// NEWSLETTER
// ═══════════════════════════════════════════════════════════════
const CG_Newsletter = {
    async subscribe(email) {
        try {
            const { error } = await getSB().from('newsletter').insert({ email });
            if (error) {
                if (error.code === '23505') return { success: true, alreadySubscribed: true };
                throw error;
            }
            return { success: true };
        } catch (err) { return { success: false, error: err.message }; }
    }
};

// ═══════════════════════════════════════════════════════════════
// WISHLIST
// ═══════════════════════════════════════════════════════════════
const CG_Wishlist = {
    async toggle(productId, productName, productPrice) {
        const user = await CG_Auth.getUser();
        if (!user) { window.location.href = 'login.html'; return; }
        const sb = getSB();
        const { data } = await sb.from('wishlist').select('id')
            .eq('user_id', user.id).eq('product_id', productId).single();
        if (data) {
            await sb.from('wishlist').delete().eq('id', data.id);
            return { wishlisted: false };
        } else {
            await sb.from('wishlist').insert({
                user_id: user.id, product_id: productId,
                product_name: productName, product_price: productPrice
            });
            return { wishlisted: true };
        }
    },
    async getAll() {
        const user = await CG_Auth.getUser();
        if (!user) return [];
        const { data } = await getSB().from('wishlist').select('*').eq('user_id', user.id);
        return data || [];
    }
};

// ═══════════════════════════════════════════════════════════════
// AUTO-INIT on every page load
// ═══════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
    await CG_Auth.updateNav();
});