"use client";
import { format } from "date-fns";
import { FaDownload } from "react-icons/fa";
import { FaPlus } from "react-icons/fa6";

export default function RemindersComponent({
  reminders,
  selectedDate,
  onPreviousDay,
  onNextDay,
  onCheckboxChange,
  onAddReminder,
}) {
  const completedReminders = reminders.filter((item) => item.completed).length;
  const totalReminders = reminders.length;

  const completionPercentage =
    totalReminders > 0
      ? Math.round((completedReminders / totalReminders) * 100)
      : 0;

  return (
    <div className="flex flex-col">
      <div className="p-4 bg-white rounded-lg shadow-lg w-full max-w-md mx-auto mb-4">
        <div className="flex items-center justify-center mb-5">
          <button
            className="bg-blue-500 text-white rounded-l-md p-1.5 hover:bg-blue-600 text-base"
            onClick={onPreviousDay}
          >
            {"<"}
          </button>
          <span className="px-3 text-base font-medium text-gray-800">
            {format(selectedDate, "dd-MM-yyyy")}
          </span>
          <button
            className="bg-blue-500 text-white rounded-r-md p-1.5 hover:bg-blue-600 text-base"
            onClick={onNextDay}
          >
            {">"}
          </button>
          <button
            onClick={onAddReminder}
            className="ml-6 p-2 bg-secondary text-white rounded-full hover:bg-secondaryHover flex-shrink-0"
          >
            <FaPlus size={14} />
          </button>
        </div>

        <h3 className="text-2xl font-bold text-black mb-3">
          Recordatorio Personal
        </h3>

        <div className="flex items-center mb-3">
          <div className="flex-grow bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-green-500 h-2.5 rounded-full"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
          <span className="ml-2 text-gray-600 text-sm">
            {completionPercentage}%
          </span>
        </div>

        <ul className="space-y-2">
          {reminders.length > 0 ? (
            reminders.map((item) => {
              const startDate = new Date(item.startDate);
              const hours = String(startDate.getUTCHours()).padStart(2, "0");
              const minutes = String(startDate.getUTCMinutes()).padStart(
                2,
                "0"
              );
              const timeString = `${hours}:${minutes}`;

              return (
                <li key={item.uuid} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => onCheckboxChange(item)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded mr-2"
                  />
                  <span
                    className={`flex-grow ${
                      item.completed
                        ? "line-through text-gray-400"
                        : "text-gray-800"
                    }`}
                  >
                    {item.subject}{" "}
                    <span className="text-gray-500 text-sm">
                      at {timeString}
                    </span>
                  </span>
                  {item.documentUri ? (
                    <a
                      href={item.documentUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-500 hover:text-blue-700"
                    >
                      <FaDownload />
                    </a>
                  ) : (
                    <span className="ml-2 text-gray-500 text-sm">
                      No hay adjunto
                    </span>
                  )}
                </li>
              );
            })
          ) : (
            <p className="text-gray-500 text-sm">
              No hay recordatorios para esta fecha.
            </p>
          )}
        </ul>
      </div>
    </div>
  );
}
