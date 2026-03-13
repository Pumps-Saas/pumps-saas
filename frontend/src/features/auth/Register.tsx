import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useToast } from '../../components/ui/Toast';

export const Register = () => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const initialEmail = queryParams.get('email') || '';
    const inviteCode = queryParams.get('invite_code') || '';
    const isCheckoutSuccess = queryParams.get('success') === 'true';

    const [email, setEmail] = useState(initialEmail);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { register } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await register({ email, password, invite_code: inviteCode });
            addToast("Registration successful! Please login.", 'success');
            navigate(`/login`);
        } catch (err: any) {
            const msg = err.response?.data?.detail || 'Registration failed';
            setError(msg);
            addToast(msg, 'error');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        Create your account
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        {inviteCode ? "Complete your profile to access your subscription." : "Fill in your details below to create a trial account."}
                    </p>
                </div>
                
                {isCheckoutSuccess && !inviteCode ? (
                    <div className="rounded-md bg-green-50 p-4 mt-8">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-green-800">Pagamento Confirmado!</h3>
                                <div className="mt-2 text-sm text-green-700">
                                    <p>Obrigado por assinar o Pumps SaaS. Por favor, <b>verifique o seu e-mail</b> informando durante a compra. Enviamos um link de ativação exclusivo para você criar sua senha e acessar a plataforma.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : !inviteCode ? (
                    <div className="rounded-md bg-yellow-50 p-4 mt-8">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-yellow-800">Acesso Restrito</h3>
                                <div className="mt-2 text-sm text-yellow-700">
                                    <p>O registro no Pumps SaaS é feito exclusivamente mediante ativação de assinatura via e-mail ou por um convite da administração.</p>
                                </div>
                                <div className="mt-4">
                                    <Link to="/#pricing" className="text-sm font-medium text-yellow-800 hover:text-yellow-700">Ver nossos Planos &rarr;</Link>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <input type="hidden" name="remember" value="true" />
                        <div className="rounded-md shadow-sm -space-y-px">
                            <div>
                                <input
                                    type="email"
                                    required
                                    readOnly={!!initialEmail}
                                    className={`appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm ${initialEmail ? 'bg-gray-100' : ''}`}
                                    placeholder="Email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div>
                                <input
                                    type="password"
                                    required
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="text-red-500 text-sm text-center bg-red-50 rounded p-2">
                                {error}
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Register
                            </button>
                        </div>
                    </form>
                )}
                
                <div className="text-center mt-4">
                    <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                        Already have an account? Sign in
                    </Link>
                </div>
            </div>
        </div>
    );
};
