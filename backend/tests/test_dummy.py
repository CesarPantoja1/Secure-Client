def test_dummy():
    # Este test vacío asegura que pytest siempre recolecte al menos 1 test
    # y no falle con código 5 (No tests collected) cuando los demás tests 
    # son omitidos en el entorno de CI.
    assert True
