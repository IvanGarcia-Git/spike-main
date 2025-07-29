export function cutUserEmail(email) {
  const length = email.length;
  if (length < 20) return email;

  const shortenedEmail = email.slice(0, 18);
  return shortenedEmail + "...";
}
