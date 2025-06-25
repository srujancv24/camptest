import { useState } from 'react';
import LoginForm from '../components/LoginForm.jsx';
import RegisterForm from '../components/RegisterForm.jsx';

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">🏕️ CampScout</h1>
                    <p className="text-lg text-gray-600">
                        Never miss a campsite reservation again
                    </p>
                </div>
            </div>

            {/* Auth Form */}
            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                {isLogin ? (
                    <LoginForm onSwitchToRegister={() => setIsLogin(false)} />
                ) : (
                    <RegisterForm onSwitchToLogin={() => setIsLogin(true)} />
                )}
            </div>

            {/* Features Section */}
            <div className="mt-12 max-w-4xl mx-auto px-4">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        Why Choose CampScout?
                    </h2>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    <div className="text-center">
                        <div className="text-4xl mb-4">🔍</div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Smart Search
                        </h3>
                        <p className="text-gray-600">
                            Search campgrounds by state, national park, or recreation area with intelligent filtering.
                        </p>
                    </div>

                    <div className="text-center">
                        <div className="text-4xl mb-4">🔔</div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Instant Alerts
                        </h3>
                        <p className="text-gray-600">
                            Get notified immediately when campsites become available at sold-out campgrounds.
                        </p>
                    </div>

                    <div className="text-center">
                        <div className="text-4xl mb-4">📱</div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Multi-Channel Notifications
                        </h3>
                        <p className="text-gray-600">
                            Receive alerts via email, SMS, or push notifications - never miss an opportunity.
                        </p>
                    </div>
                </div>

                <div className="mt-12 bg-blue-50 rounded-lg p-6">
                    <div className="text-center">
                        <h3 className="text-lg font-semibold text-blue-900 mb-2">
                            How It Works
                        </h3>
                        <div className="grid md:grid-cols-4 gap-4 mt-6">
                            <div className="text-center">
                                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">
                                    1
                                </div>
                                <p className="text-sm text-blue-800">Search for campgrounds</p>
                            </div>
                            <div className="text-center">
                                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">
                                    2
                                </div>
                                <p className="text-sm text-blue-800">Set availability alerts</p>
                            </div>
                            <div className="text-center">
                                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">
                                    3
                                </div>
                                <p className="text-sm text-blue-800">Get instant notifications</p>
                            </div>
                            <div className="text-center">
                                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">
                                    4
                                </div>
                                <p className="text-sm text-blue-800">Book your perfect site</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-12 text-center text-sm text-gray-500">
                <p>© 2024 CampScout. Built with ❤️ for outdoor enthusiasts.</p>
            </div>
        </div>
    );
};

export default AuthPage;