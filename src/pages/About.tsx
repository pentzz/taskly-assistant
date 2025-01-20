import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <img src="/logo.svg" alt="Taskly Assistant Logo" className="h-16 w-16" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            אודות Taskly Assistant
          </h1>
        </div>

        <div className="prose prose-lg mx-auto text-right">
          <p className="text-gray-600 text-lg leading-relaxed mb-8">
            Taskly Assistant היא מערכת ניהול משימות מתקדמת שנועדה לעזור לך לנהל את הזמן והמשימות שלך בצורה חכמה ויעילה. המערכת כוללת עוזר אישי מבוסס בינה מלאכותית להמלצות ותמיכה בזמן אמת.
          </p>

          <h2 className="text-2xl font-bold text-gray-800 mb-4">המטרות שלנו</h2>
          <ul className="space-y-4 text-gray-600">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
              לספק כלי ניהול משימות יעיל ופשוט
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
              לשלב המלצות חכמות לניהול זמן
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
              להתאים לכל משתמש לפי צרכיו האישיים
            </li>
          </ul>
        </div>
      </main>

      <Footer />
    </div>
  );
}