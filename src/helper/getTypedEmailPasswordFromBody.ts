const getTypedEmailPasswordFromBody = (body: { [x: string]: string | File }) => {
  const email = body['email'].toString();
  const password = body['password'].toString();

  return {
    email,
    password
  }
}

export {
  getTypedEmailPasswordFromBody
}
