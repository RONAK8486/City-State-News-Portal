import NewsForm from './NewsForm';

const PublisherDashboard = () => {
    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8 p-6 bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl shadow-lg text-white">
                <h1 className="text-3xl font-bold mb-2">Publisher Dashboard</h1>
                <p className="opacity-90">Welcome! You can create and publish new articles from this single-feature dashboard.</p>
            </div>
            
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                <div className="p-1">
                    <NewsForm />
                </div>
            </div>
        </div>
    );
};

export default PublisherDashboard;
