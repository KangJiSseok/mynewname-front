import * as React from "react"

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => {
  return <input {...props} />;
};

Input.displayName = "Input"

export { Input }
