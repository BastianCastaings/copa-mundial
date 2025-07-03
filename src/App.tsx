import React, { useState, useEffect } from "react";
import "./App.css";

interface Country {
  name: string;
  continent: string;
  code: string;
}

function normalizeContinent(continent: string): string {
  switch (continent) {
    case "Americas":
      return "América";
    case "Europe":
      return "Europa";
    case "Asia":
      return "Asia";
    case "Africa":
      return "África";
    case "Oceania":
      return "Oceanía";
    default:
      return continent;
  }
}

async function searchCountryByName(name: string): Promise<Country | null> {
  try {
    const res = await fetch(`https://restcountries.com/v3.1/name/${name}`);
    if (!res.ok) return null;
    const data = await res.json();
    const match = data[0];
    return {
      name: match.name.common,
      continent: normalizeContinent(
        match.region || match.continents?.[0] || ""
      ),
      code: match.cca3,
    };
  } catch {
    return null;
  }
}

const App: React.FC = () => {
  const [selectedCountries, setSelectedCountries] = useState<Country[]>(() => {
    const saved = localStorage.getItem("selectedCountries");
    return saved ? JSON.parse(saved) : [];
  });

  const [inputName, setInputName] = useState("");
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState(false);
  const [countryToEdit, setCountryToEdit] = useState<Country | null>(null);

  useEffect(() => {
    localStorage.setItem(
      "selectedCountries",
      JSON.stringify(selectedCountries)
    );
  }, [selectedCountries]);

  const handleAddOrUpdate = async () => {
    const trimmedName = inputName.trim();
    if (trimmedName === "") {
      setMessage("⚠️ Escriba el nombre de un país.");
      return;
    }

    const country = await searchCountryByName(trimmedName);
    if (!country) {
      setMessage("❌ País no encontrado en la API.");
      return;
    }

    const alreadyExists = selectedCountries.find(
      (c) => c.code === country.code
    );

    if (editing) {
      if (!countryToEdit) return;

      // Verificar si intenta reemplazar por un país ya registrado
      if (alreadyExists && country.code !== countryToEdit.code) {
        setMessage("❌ Este país ya está registrado.");
        return;
      }

      // Verificar límite por continente (excluyendo el actual)
      const sameContinentCount = selectedCountries.filter(
        (c) =>
          c.continent === country.continent && c.code !== countryToEdit.code
      ).length;
      if (sameContinentCount >= 4) {
        setMessage(`❌ Ya hay 4 países del continente ${country.continent}.`);
        return;
      }

      const updatedList = selectedCountries.map((c) =>
        c.code === countryToEdit.code ? country : c
      );
      setSelectedCountries(updatedList);
      setMessage(`✅ País actualizado correctamente.`);
      setEditing(false);
      setCountryToEdit(null);
      setInputName("");
    } else {
      if (selectedCountries.length >= 16) {
        setMessage("❌ Ya se registraron los 16 países permitidos.");
        return;
      }

      if (alreadyExists) {
        setMessage("❌ Este país ya fue registrado.");
        return;
      }

      const continentCount = selectedCountries.filter(
        (c) => c.continent === country.continent
      ).length;
      if (continentCount >= 4) {
        setMessage(
          `❌ Ya hay 4 países registrados del continente ${country.continent}.`
        );
        return;
      }

      setSelectedCountries([...selectedCountries, country]);
      setMessage(`✅ País "${country.name}" agregado correctamente.`);
      setInputName("");
    }
  };

  const handleDelete = (code: string) => {
    if (confirm("¿Eliminar este país?")) {
      setSelectedCountries(selectedCountries.filter((c) => c.code !== code));
      setMessage("ℹ️ País eliminado.");
    }
  };

  const handleEdit = (country: Country) => {
    setEditing(true);
    setCountryToEdit(country);
    setInputName(country.name);
    setMessage(
      "✏️ Modo edición activado. Modifica el nombre y presiona Actualizar."
    );
  };

  const cancelEdit = () => {
    setEditing(false);
    setCountryToEdit(null);
    setInputName("");
    setMessage("✖️ Edición cancelada.");
  };

  return (
    <div className="container">
      <h1 className="mb-3">🌍 Registro de Países - GlobalSportsTech</h1>
      <p>
        Ingresa el nombre del país y presiona{" "}
        <strong>{editing ? "Actualizar" : "Agregar"}</strong>. Se validarán las
        siguientes reglas:
      </p>
      <ul>
        <li>Máximo 16 países en total.</li>
        <li>Máximo 4 países por continente.</li>
        <li>No se pueden repetir países.</li>
        <li>El país debe existir en la API.</li>
      </ul>

      <div className="mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Ej: Japón"
          value={inputName}
          onChange={(e) => setInputName(e.target.value)}
        />
      </div>

      <div className="mb-3">
        <button className="btn btn-success me-2" onClick={handleAddOrUpdate}>
          {editing ? "Actualizar país" : "Agregar país"}
        </button>
        {editing && (
          <button className="btn btn-secondary" onClick={cancelEdit}>
            Cancelar
          </button>
        )}
      </div>

      {message && <div className="alert alert-info">{message}</div>}

      <h5 className="mt-4">
        🌐 Países registrados ({selectedCountries.length}/16)
      </h5>

      {selectedCountries.length === 0 ? (
        <p className="text-muted">No hay países registrados aún.</p>
      ) : (
        <ul className="list-group">
          {selectedCountries.map((c) => (
            <li
              key={c.code}
              className="list-group-item d-flex justify-content-between align-items-center"
            >
              <span>
                <strong>{c.name}</strong> - <em>{c.continent}</em>
              </span>
              <div>
                <button
                  className="btn btn-warning btn-sm me-2"
                  onClick={() => handleEdit(c)}
                >
                  Editar
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(c.code)}
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default App;
