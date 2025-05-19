            <div className="flex items-center space-x-4">
              {/* Notification Bell Icon */}
              <button className="text-white hover:text-primary">
                <FaBell className="w-5 h-5" />
              </button>
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="text-white hover:text-primary flex items-center space-x-2"
              >
                <FaSignOutAlt className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div> 