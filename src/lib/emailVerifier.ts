const verifyEmail = async (email: string) => {
  const apiKey = import.meta.env.VITE_ABSTRACT_API_KEY;
  const response = await fetch(
    `https://emailvalidation.abstractapi.com/v1/?api_key=${apiKey}&email=${email}`
  );
  const data = await response.json();
  
  // data.deliverability será "DELIVERABLE", "UNDELIVERABLE", etc
  // data.is_disposable_email dirá si es un email temporal
  return data.deliverability === "DELIVERABLE" && !data.is_disposable_email;
}; 