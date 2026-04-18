export async function getCoordinatesFromCEP(cep: string): Promise<{ lat: number; lng: number; city: string; state: string } | null> {
  const cleanCEP = cep.replace(/\D/g, '');
  if (cleanCEP.length !== 8) return null;

  try {
    // 1. Get address from ViaCEP
    const viaCepResponse = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
    const viaCepData = await viaCepResponse.json();

    if (viaCepData.erro) return null;

    const { logradouro, localidade, uf } = viaCepData;
    const address = `${logradouro}, ${localidade}, ${uf}, Brasil`;

    // 2. Get coordinates from Nominatim
    // Nominatim requires a User-Agent header or a valid referer
    const nominatimResponse = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      {
        headers: {
          'Accept-Language': 'pt-BR,pt;q=0.9'
        }
      }
    );
    const nominatimData = await nominatimResponse.json();

    if (nominatimData && nominatimData.length > 0) {
      return {
        lat: parseFloat(nominatimData[0].lat),
        lng: parseFloat(nominatimData[0].lon),
        city: localidade,
        state: uf
      };
    }

    // Fallback: search only by city and state if full address fails
    const fallbackResponse = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&city=${encodeURIComponent(localidade)}&state=${encodeURIComponent(uf)}&country=Brazil&limit=1`
    );
    const fallbackData = await fallbackResponse.json();
    if (fallbackData && fallbackData.length > 0) {
      return {
        lat: parseFloat(fallbackData[0].lat),
        lng: parseFloat(fallbackData[0].lon),
        city: localidade,
        state: uf
      };
    }

    return null;
  } catch (error) {
    console.error('Error in geocoding:', error);
    return null;
  }
}
