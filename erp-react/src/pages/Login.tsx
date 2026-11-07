import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/img/logo.png';
import '../styles/login.css';

/**
 * Login/Signup — porting 1:1 di index.html (stessa marcatura, stesso
 * CSS, stessa animazione flip 3D). Unica differenza: niente più
 * document.getElementById, stato gestito da React.
 */
export function Login() {
    const [flipped, setFlipped] = useState(false);
    const [remember, setRemember] = useState(false);
    const navigate = useNavigate();

    function goToDashboard() {
        // TODO(step successivo): autenticazione reale via backend +
        // TanStack Query mutation, sessione server-side (spec §2).
        navigate('/dashboard');
    }

    return (
        <div className="login-page">
            <div className="login-wrapper">
                <div className={`flip-scene${flipped ? ' flipped' : ''}`}>
                    <div className="flip-card">

                        {/* FRONT — LOGIN */}
                        <div className="glass-circle front">
                            <div className="accent-ring" />

                            <form className="login-form" onSubmit={(e) => e.preventDefault()}>
                                <img src={logo} alt="Logo" className="form-logo" />
                                <h1>Login</h1>
                                <div className="subtitle">Sign in to your account</div>

                                <div className="input-box">
                                    <i className="fa-solid fa-user" />
                                    <input type="text" placeholder="Username" autoComplete="off" />
                                </div>

                                <div className="input-box">
                                    <i className="fa-solid fa-lock" />
                                    <input type="password" placeholder="Password" autoComplete="off" />
                                </div>

                                <div className="forgot">
                                    <div className="remember">
                                        <div
                                            className={`switch${remember ? ' on' : ''}`}
                                            onClick={() => setRemember((v) => !v)}
                                        />
                                        Remember me
                                    </div>
                                    <a href="#!">Forgot password?</a>
                                </div>

                                <button type="button" onClick={goToDashboard}>Sign In</button>

                                <div className="signup-text">
                                    Don't have an account? <a onClick={() => setFlipped(true)}>Sign up</a>
                                </div>
                            </form>
                        </div>

                        {/* BACK — SIGN UP */}
                        <div className="glass-circle back">
                            <div className="accent-ring" />

                            <form className="login-form" onSubmit={(e) => e.preventDefault()}>
                                <img src={logo} alt="Logo" className="form-logo" />
                                <h1>Sign Up</h1>
                                <div className="subtitle">Create your account</div>

                                <div className="input-box">
                                    <i className="fa-solid fa-user" />
                                    <input type="text" placeholder="Full name" autoComplete="off" />
                                </div>

                                <div className="input-box">
                                    <i className="fa-solid fa-envelope" />
                                    <input type="email" placeholder="Email" autoComplete="off" />
                                </div>

                                <div className="input-box" style={{ marginBottom: 30 }}>
                                    <i className="fa-solid fa-lock" />
                                    <input type="password" placeholder="Password" autoComplete="off" />
                                </div>

                                <button type="button" onClick={goToDashboard}>Create Account</button>

                                <div className="signup-text">
                                    Already have an account? <a onClick={() => setFlipped(false)}>Login</a>
                                </div>
                            </form>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
