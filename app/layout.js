import './globals.css';
import Navbar from './Navbar';
import Script from 'next/script';

export const metadata = {
  title: 'Arogya AI - Personal Nutrition Assistant',
  description: 'AI-powered personal health coach and nutrition planner for Indian diets.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <head>
        {/* Bootstrap 5 CSS */}
        <link
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
          rel="stylesheet"
          precedence="default"
        />
        {/* FontAwesome Icons */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css"
          precedence="default"
        />
        {/* Custom CSS */}
        <link rel="stylesheet" href="/static/css/styles.css" precedence="default" />
      </head>
      <body className="min-h-full flex flex-col dark-mode">
        {/* Navigation Bar */}
        <Navbar />

        {/* Main Content Body */}
        <main className="container py-4 my-2 flex-grow-1">
          {children}
        </main>

        {/* Footer */}
        <footer className="footer mt-auto py-4 border-top border-secondary-subtle">
          <div className="container text-center">
            <p className="mb-1 fw-semibold">&copy; 2026 Arogya AI. Your Path to Healthy Living.</p>
            <p className="small text-secondary max-width-600 mx-auto">
              <i className="fas fa-exclamation-triangle me-1 text-warning"></i>
              <strong>Medical Disclaimer:</strong> Arogya AI provides digital health insights for guidance only. It is not a substitute for clinical diagnosis, treatment advice, or consultation with healthcare professionals.
            </p>
          </div>
        </footer>

        {/* Bootstrap 5 Bundle JS */}
        <Script
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
