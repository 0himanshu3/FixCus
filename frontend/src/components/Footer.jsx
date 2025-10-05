import React from 'react';
import { FaFacebook, FaInstagram ,FaYoutube , FaTwitter, FaWhatsapp, FaLinkedin} from 'react-icons/fa';

function Footer() {
  return (
  <footer className="bg-gradient-to-r from-purple-900 via-purple-800 to-pink-800 text-pink-100 p-2 relative border-t-4 border-pink-400">
    <div className="container mx-auto flex flex-col md:flex-row items-center justify-between">
      {/* Contact Info - 2cm from left */}
      <div className="md:ml-[2cm] mb-4 md:mb-0 text-left">
        <h3 className="font-black mb-2 text-yellow-300 text-lg overflow-hidden">📞 Contact us</h3>
        <p className="text-sm font-semibold">info@fixcus.org</p>
        <p className="text-sm font-semibold">kumar@fixcus.org</p>
        <p className="text-sm font-semibold">+91 80 25721444 / 9922</p>
      </div>

      {/* Centered copyright and links - now properly aligned */}
      <div className="order-first md:order-none flex flex-col absolute left-[15cm] top-8 mb-4 md:mb-0">
        <p className="mb-2 font-bold text-pink-200">
          &copy; {new Date().getFullYear()} FixCus. All rights reserved.
        </p>
        <div className="flex space-x-2 font-semibold">
          <a href="#" className="text-yellow-300 hover:text-yellow-100 transition duration-200">
            Privacy Policy
          </a>
          <span className="text-pink-300">|</span>
          <a href="#" className="text-yellow-300 hover:text-yellow-100 transition duration-200">
            Terms of Service
          </a>
        </div>
      </div>

      {/* Social Media section - adjusted positioning */}
      <div className="md:absolute left-[30cm] top-6 mb-4 md:mb-0">
        <h3 className="font-black mb-3 text-center md:text-left text-yellow-300 text-lg overflow-hidden">
          🎪 SOCIAL MEDIA
        </h3>
        <div className="flex  gap-3 w-max mx-auto md:mx-0">
          {/* Row 1 */}
          <a
            href="https://www.facebook.com/fixcusfb"
            target="_blank"
            rel="noopener noreferrer"
            className="text-pink-200 hover:text-blue-400 transition duration-200 transform hover:scale-110"
            aria-label="Facebook"
          >
            <FaFacebook size={20} />
          </a>
          <a
            href="https://www.instagram.com/codesangam-fixcus/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-pink-200 hover:text-pink-400 transition duration-200 transform hover:scale-110"
            aria-label="Instagram"
          >
            <FaInstagram size={20} />
          </a>
          <a
            href="https://www.youtube.com/channel/fixcus-channel"
            target="_blank"
            rel="noopener noreferrer"
            className="text-pink-200 hover:text-red-400 transition duration-200 transform hover:scale-110"
            aria-label="YouTube"
          >
            <FaYoutube size={20} />
          </a>

          {/* Row 2 */}
          <a
            href="https://x.com/fixcus"
            target="_blank"
            rel="noopener noreferrer"
            className="text-pink-200 hover:text-blue-300 transition duration-200 transform hover:scale-110"
            aria-label="Twitter"
          >
            <FaTwitter size={20} />
          </a>
          <a
            href="https://www.linkedin.com/company/fixcus-trust/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-pink-200 hover:text-blue-500 transition duration-200 transform hover:scale-110"
            aria-label="LinkedIn"
          >
            <FaLinkedin size={20} />
          </a>
        </div>
      </div>
    </div>
  </footer>
);

}

export default Footer;