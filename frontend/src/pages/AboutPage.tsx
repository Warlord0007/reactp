import type React from "react"

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">About ZIIIP</h1>
          <p className="text-xl text-gray-600">Your premier destination for fashion and style</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-8">
          <p className="text-gray-700 leading-relaxed">
            Welcome to ZIIIP, where fashion meets innovation. We are dedicated to providing you with the latest trends
            and timeless classics that define your unique style. Our carefully curated collection ensures that you
            always look your best, whether you're dressing for work, play, or special occasions.
          </p>
        </div>
      </div>
    </div>
  )
}

export default AboutPage
