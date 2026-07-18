import { useState } from "react";
import { toast } from "sonner";

const useFetch = (cb) => {
  const [data, setData] = useState(undefined);
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);

  const fn = async (...args) => {
    setLoading(true);
    setError(null);

    let response;
    try {
      response = await cb(...args);
      setData(response);
      setError(null);
      return response;
    } catch (error) {
      setError(error);
      toast.error(error?.message || "Something went wrong.");
      return undefined;
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, fn, setData };
};

export default useFetch;
