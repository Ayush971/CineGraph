import React from 'react';

const SeriesHomePage: React.FC = () => {
  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            📺 Series
          </h1>
          <p className="text-gray-400 text-lg mb-8">
            Coming Soon! Track your favorite TV shows
          </p>
          
          <div className="mt-12 p-12 bg-surface-light rounded-lg">
            <p className="text-2xl text-gray-300">
              Series tracking feature is under development
            </p>
            <p className="text-gray-500 mt-4">
              Stay tuned for updates!
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SeriesHomePage;