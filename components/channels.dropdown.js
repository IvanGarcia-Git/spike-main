import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { createPopper } from "@popperjs/core";

export default function ChannelsDropdown({
  channels,
  channelId,
  onChannelChange,
}) {
  const [selectedChannel, setSelectedChannel] = useState({});
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    const currentChannel = channels.find((channel) => channel.id === channelId);
    setSelectedChannel(currentChannel || {});
  }, [channelId, channels]);

  useEffect(() => {
    if (isDropdownOpen && buttonRef.current && dropdownRef.current) {
      createPopper(buttonRef.current, dropdownRef.current, {
        placement: "bottom-start",
        modifiers: [
          {
            name: "offset",
            options: {
              offset: [0, 4],
            },
          },
          {
            name: "preventOverflow",
            options: {
              boundary: "viewport",
            },
          },
        ],
      });
    }
  }, [isDropdownOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isDropdownOpen &&
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleChannelChange = (newChannel) => {
    setSelectedChannel(newChannel);
    onChannelChange(newChannel);
    setIsDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  return (
    <div className="relative w-full">
      <button
        ref={buttonRef}
        className="flex justify-center items-center px-4 py-2 bg-backgroundHoverBold rounded-md text-black w-full border border-gray-300"
        onClick={toggleDropdown}
      >
        {selectedChannel?.name || "No asignado"}
      </button>

      {isDropdownOpen &&
        createPortal(
          <ul
            ref={dropdownRef}
            className="bg-background border border-gray-600 rounded-md shadow-lg z-50 max-h-48 overflow-y-auto"
            style={{
              top: "100%",
              left: 0,
            }}
          >
            {channels.length > 0 ? (
              channels.map((channel) => (
                <li
                  key={channel.id}
                  className={`flex items-center px-4 py-2 cursor-pointer hover:bg-backgroundHoverBold text-black ${
                    channel.id === selectedChannel?.id
                      ? "bg-backgroundHoverBold"
                      : ""
                  }`}
                  onClick={() => handleChannelChange(channel)}
                >
                  {channel.name}
                </li>
              ))
            ) : (
              <li className="text-gray-400 px-4 py-2">
                No hay canales disponibles
              </li>
            )}
          </ul>,
          document.body
        )}
    </div>
  );
}
