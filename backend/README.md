## Backend indítása

A backend kétféleképpen indítható: **VSCode debugból** vagy **terminálból**.

---

### **Indítás VSCode-ból**

A bal oldali **Run and Debug** panelen válaszd ki a következőt: Python Debugger: FastAPI


Majd kattints a **Start Debugging** gombra.

Ez a `launch.json` konfigurációt használja a szerver elindításához.

---

### **Indítás terminálból**

Futtasd a projekt gyökérkönyvtárából:

```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```


