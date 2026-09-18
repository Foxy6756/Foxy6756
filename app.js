/**
 * ARQUITECTURA MVC - CENTRO DE OPERACIONES DE SEGURIDAD (SOC)
 * Conexión cliente-servidor con Fetch API hacia endpoint REST Node.js
 */

// ==========================================
// 1. MODELO (MODEL) - Capa de Datos
// ==========================================
class IncidentModel {
    constructor() {
        this.incidentes = [];
        this.selectedIncident = null;
    }

    /**
     * Carga asíncrona de datos desde el endpoint REST JSON del servidor Node.js
     */
    async cargarIncidentesIniciales() {
        try {
            const respuesta = await fetch('/api/incidentes');
            if (!respuesta.ok) {
                throw new Error(`Error HTTP: ${respuesta.status}`);
            }
            const datos = await respuesta.json();
            this.incidentes = datos;
            if (this.incidentes.length > 0) {
                this.selectedIncident = this.incidentes[0];
            }
            return this.incidentes;
        } catch (error) {
            console.warn('Fallo al conectar con el servidor Node.js, usando respaldo:', error);
            this.incidentes = [
                {
                    id: "2026-12#1512",
                    tipo: "phishing",
                    tipoNombre: "Phishing",
                    nivel: "alto",
                    nivelNombre: "Alto",
                    fecha: "2026-06-01",
                    hora: "09:42",
                    estado: "Pendiente",
                    descripcion: "Se detectó un intento de exfiltración dirigido al personal contable mediante hipervínculos ofuscados y suplantación de dominio corporativo."
                },
                {
                    id: "2026-12#1513",
                    tipo: "fuerza-bruta",
                    tipoNombre: "Fuerza Bruta",
                    nivel: "alto",
                    nivelNombre: "Alto",
                    fecha: "2026-06-01",
                    hora: "10:15",
                    estado: "En curso",
                    descripcion: "Múltiples intentos fallidos de autenticación SSH provenientes de un pool de direcciones IP no reconocidas contra el servidor perimetral."
                }
            ];
            this.selectedIncident = this.incidentes[0];
            return this.incidentes;
        }
    }

    obtenerTodos() {
        return [...this.incidentes];
    }

    obtenerPorId(id) {
        return this.incidentes.find(item => item.id === id) || null;
    }

    agregarIncidente(nuevoIncidente) {
        this.incidentes.unshift(nuevoIncidente);
        this.selectedIncident = nuevoIncidente;
        return nuevoIncidente;
    }

    obtenerEstadisticas() {
        const total = this.incidentes.length;
        const criticosOAltos = this.incidentes.filter(i => i.nivel === 'critico' || i.nivel === 'alto').length;
        const pendientes = this.incidentes.filter(i => i.estado === 'Pendiente').length;
        return { total, criticosOAltos, pendientes };
    }
}

// ==========================================
// 2. VISTA (VIEW) - Manipulación de DOM y ARIA
// ==========================================
class IncidentView {
    constructor() {
        this.tablaCuerpo = document.getElementById('tabla-incidentes-body');
        this.formulario = document.querySelector('.incident-form');
        this.ariaLiveRegion = document.getElementById('aria-announcer');
        
        this.detalleId = document.getElementById('detalle-id');
        this.detalleTipo = document.getElementById('detalle-tipo');
        this.detalleNivel = document.getElementById('detalle-nivel');
        this.detalleFecha = document.getElementById('detalle-fecha');
        this.detalleEstado = document.getElementById('detalle-estado');
        this.detalleDesc = document.getElementById('detalle-descripcion');

        this.kpiTotal = document.getElementById('kpi-total-incidentes');
        this.kpiAlerta = document.getElementById('kpi-nivel-alerta');
    }

    anunciar(mensaje, tipo = 'polite') {
        if (!this.ariaLiveRegion) return;
        this.ariaLiveRegion.setAttribute('aria-live', tipo);
        this.ariaLiveRegion.textContent = '';
        setTimeout(() => {
            this.ariaLiveRegion.textContent = mensaje;
        }, 80);
    }

    renderizarTabla(incidentes) {
        this.tablaCuerpo.innerHTML = '';

        if (incidentes.length === 0) {
            this.tablaCuerpo.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center; padding: 1.5rem; color: var(--text-secondary);">
                        No hay tickets de seguridad registrados.
                    </td>
                </tr>
            `;
            return;
        }

        incidentes.forEach(incidente => {
            const tr = document.createElement('tr');
            tr.setAttribute('data-id', incidente.id);
            tr.className = 'incident-row';

            const badgeClass = incidente.nivel === 'critico' || incidente.nivel === 'alto' 
                ? 'badge-high' 
                : (incidente.nivel === 'medio' ? 'badge-medium' : 'badge-low');

            let statusClass = 'status-pending';
            if (incidente.estado === 'En curso') statusClass = 'status-progress';
            if (incidente.estado === 'Resuelto') statusClass = 'status-resolved';

            tr.innerHTML = `
                <td class="ticket-code">${incidente.id}</td>
                <td><strong>${incidente.tipoNombre || incidente.tipo}</strong></td>
                <td><span class="badge ${badgeClass}">${incidente.nivelNombre || incidente.nivel}</span></td>
                <td>${incidente.fecha}</td>
                <td><span class="status-pill ${statusClass}">${incidente.estado}</span></td>
                <td class="text-right">
                    <button type="button" class="btn btn-sm btn-action-view" data-id="${incidente.id}" aria-label="Ver detalles del ticket ${incidente.id}">
                        Ver detalles
                    </button>
                </td>
            `;

            this.tablaCuerpo.appendChild(tr);
        });

        if (window.jQuery) {
            $('.btn-action-view').off('mouseenter mouseleave').hover(
                function() { $(this).css('box-shadow', '0 0 6px rgba(56, 189, 248, 0.4)'); },
                function() { $(this).css('box-shadow', 'none'); }
            );
        }
    }

    renderizarDetalles(incidente) {
        if (!incidente) return;

        this.detalleId.textContent = incidente.id;
        this.detalleTipo.textContent = `${incidente.tipoNombre || incidente.tipo}`;
        
        const badgeClass = incidente.nivel === 'critico' || incidente.nivel === 'alto' 
            ? 'badge-high' 
            : (incidente.nivel === 'medio' ? 'badge-medium' : 'badge-low');

        this.detalleNivel.innerHTML = `<span class="badge ${badgeClass}">${incidente.nivelNombre || incidente.nivel}</span>`;
        this.detalleFecha.textContent = `${incidente.fecha} • ${incidente.hora || '00:00'} UTC`;
        
        let statusClass = 'status-pending';
        if (incidente.estado === 'En curso') statusClass = 'status-progress';
        if (incidente.estado === 'Resuelto') statusClass = 'status-resolved';

        this.detalleEstado.innerHTML = `<span class="status-pill ${statusClass}">${incidente.estado}</span>`;
        this.detalleDesc.textContent = incidente.descripcion;

        if (window.jQuery) {
            $('#detalles').css('border-color', 'var(--accent-blue)');
            setTimeout(() => {
                $('#detalles').css('border-color', 'var(--border-color)');
            }, 500);
        }
    }

    renderizarMetricas(estadisticas) {
        if (this.kpiTotal) {
            this.kpiTotal.textContent = String(estadisticas.total).padStart(2, '0');
        }
        if (this.kpiAlerta) {
            this.kpiAlerta.textContent = estadisticas.criticosOAltos > 2 ? 'Elevado (DEFCON 2)' : 'Normal (DEFCON 4)';
        }
    }

    mostrarErrorCampo(input, mensaje) {
        input.classList.add('input-error');
        let errorSpan = input.parentElement.querySelector('.field-error-msg');
        if (!errorSpan) {
            errorSpan = document.createElement('span');
            errorSpan.className = 'field-error-msg';
            errorSpan.setAttribute('role', 'alert');
            input.parentElement.appendChild(errorSpan);
        }
        errorSpan.textContent = mensaje;
    }

    limpiarErrorCampo(input) {
        input.classList.remove('input-error');
        const errorSpan = input.parentElement.querySelector('.field-error-msg');
        if (errorSpan) {
            errorSpan.remove();
        }
    }

    limpiarTodosLosErrores() {
        document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
        document.querySelectorAll('.field-error-msg').forEach(el => el.remove());
    }
}

// ==========================================
// 3. CONTROLADOR (CONTROLLER) - Lógica de Eventos
// ==========================================
class IncidentController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        this.inicializar();
    }

    async inicializar() {
        const incidentes = await this.model.cargarIncidentesIniciales();
        this.view.renderizarTabla(incidentes);
        this.view.renderizarDetalles(this.model.selectedIncident);
        this.view.renderizarMetricas(this.model.obtenerEstadisticas());
        this.view.anunciar('Sistema SOC sincronizado. Registros iniciales cargados desde servidor Node.js.');

        this.vincularEventos();
    }

    vincularEventos() {
        this.view.tablaCuerpo.addEventListener('click', (e) => {
            const boton = e.target.closest('.btn-action-view');
            if (boton) {
                const id = boton.getAttribute('data-id');
                const incidente = this.model.obtenerPorId(id);
                if (incidente) {
                    this.view.renderizarDetalles(incidente);
                    this.view.anunciar(`Mostrando detalles forenses del ticket ${incidente.id}`);
                }
            }
        });

        this.view.formulario.addEventListener('submit', (e) => {
            e.preventDefault();
            this.procesarEnvioFormulario();
        });

        const inputs = this.view.formulario.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.validarCampo(input);
            });
        });

        if (window.jQuery) {
            $('.incident-form').on('reset', () => {
                setTimeout(() => {
                    this.view.limpiarTodosLosErrores();
                    this.view.anunciar('Formulario de triaje restablecido.');
                }, 50);
            });

            $('nav a').on('click', function(e) {
                const target = $(this.attr('href'));
                if (target.length) {
                    e.preventDefault();
                    $('html, body').animate({
                        scrollTop: target.offset().top - 20
                    }, 400);
                    target.attr('tabindex', '-1').focus();
                }
            });
        }
    }

    validarCampo(input) {
        const valor = input.value.trim();
        this.view.limpiarErrorCampo(input);

        if (input.hasAttribute('required') && !valor) {
            this.view.mostrarErrorCampo(input, 'Este parámetro es obligatorio para el triaje.');
            return false;
        }

        if (input.id === 'descripcion') {
            if (valor.length < 50) {
                this.view.mostrarErrorCampo(input, `Se requieren al menos 50 caracteres (actual: ${valor.length}).`);
                return false;
            }
            if (valor.length > 500) {
                this.view.mostrarErrorCampo(input, 'La descripción no puede exceder los 500 caracteres.');
                return false;
            }
        }

        if (input.id === 'fecha') {
            const fechaIngresada = new Date(valor);
            const fechaLimite = new Date('2026-12-31');
            if (fechaIngresada > fechaLimite) {
                this.view.mostrarErrorCampo(input, 'La fecha excede el periodo del ciclo operativo 2026.');
                return false;
            }
        }

        return true;
    }

    validarFormularioCompleto() {
        let esValido = true;
        const inputs = this.view.formulario.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (!this.validarCampo(input)) {
                esValido = false;
            }
        });
        return esValido;
    }

    async procesarEnvioFormulario() {
        if (!this.validarFormularioCompleto()) {
            this.view.anunciar('Existen errores de validación en el formulario. Corrija los campos marcados.', 'assertive');
            return;
        }

        const formData = new FormData(this.view.formulario);
        const tipoSelect = document.getElementById('tipo-de-incidente');
        const nivelSelect = document.getElementById('nivel');

        const nuevoIncidente = {
            id: `2026-12#${Math.floor(1500 + Math.random() * 8500)}`,
            tipo: formData.get('tipo-de-incidente'),
            tipoNombre: tipoSelect.options[tipoSelect.selectedIndex].text,
            nivel: formData.get('nivel'),
            nivelNombre: nivelSelect.options[nivelSelect.selectedIndex].text,
            fecha: formData.get('fecha'),
            hora: formData.get('hora'),
            estado: 'Pendiente',
            descripcion: formData.get('descripcion')
        };

        // Envío HTTP POST al servidor Node.js
        try {
            await fetch('/api/incidentes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(nuevoIncidente)
            });
        } catch (error) {
            console.error('Error al persistir incidente en el servidor:', error);
        }

        // Actualizar Modelo y Vista
        this.model.agregarIncidente(nuevoIncidente);
        this.view.renderizarTabla(this.model.obtenerTodos());
        this.view.renderizarDetalles(nuevoIncidente);
        this.view.renderizarMetricas(this.model.obtenerEstadisticas());

        this.view.anunciar(`Nuevo ticket generado con éxito: ${nuevoIncidente.id}`, 'assertive');

        if (window.jQuery) {
            $('#tabla-incidentes-body tr:first-child')
                .css('background-color', 'rgba(56, 189, 248, 0.2)')
                .animate({ backgroundColor: 'transparent' }, 1200);
        }

        this.view.formulario.reset();
        this.view.limpiarTodosLosErrores();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const model = new IncidentModel();
    const view = new IncidentView();
    new IncidentController(model, view);
});
