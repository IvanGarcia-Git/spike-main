export const getNotificationDisplayProps = (notification) => {
    let icon = "🔔"; 
    let bgColor = "#ffffff"; 
    let subject = "Nueva notificación"; 
  
      switch (notification.eventType) {
        case "task":
          icon = "📋";
          bgColor = "#e879f9";
          subject = notification.subject || "Nueva tarea";
          break;
        case "reminder":
          icon = "💬";
          bgColor = "#bbf7d0";
          subject = notification.subject || "Nuevo recordatorio";
          break;
        case "leadCall":
          icon = "📞";
          bgColor = "#a5f3fc";
          subject = notification.subject || "Nueva llamada";
          break;
        default:
          subject = notification.subject || "Nueva notificación";
          break;
      }
  
    return {
      icon,
      bgColor,
      subject,
    };
  };