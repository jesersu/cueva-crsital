<?php
/**
 * Form handler for contacto.html (form "contacto") and
 * libro-de-reclamaciones.html (form "reclamo").
 *
 * - POST only. The hidden field "formulario" selects the form.
 * - Only whitelisted fields are read; everything is trimmed, length-limited
 *   and validated. Raw input never reaches a mail header: the only
 *   visitor-provided header value is a validated Reply-To address.
 * - Spam controls: honeypot field (silently accepted and dropped), minimum
 *   fill time reported by script.js (skipped when JS is off) and a per-IP
 *   rate limit stored in the system temp dir (fails open).
 * - Responses: JSON {ok, message} for fetch requests (Accept:
 *   application/json or X-Requested-With: fetch); otherwise a 303 redirect
 *   back to the form page with #enviado or #error. User input is never
 *   reflected in a response.
 * - Language: the optional hidden field "idioma" (es | en, whitelisted,
 *   default es) picks the language of the visitor-facing responses (JSON
 *   message, no-JS page) and the redirect target (/en/<page> for English).
 *   The consumer's copy of a complaint follows the same language; the
 *   business email stays in Spanish and gets an "Idioma: es|en" line.
 *
 * Plain PHP 7.4+, no dependencies.
 */

// Business inbox that receives every submission (both forms).
const DESTINO = 'mistyctulum@gmail.com';

const REMITENTE = 'no-reply@turismoloscristales.com'; // fixed From and envelope sender
const REMITENTE_NOMBRE = 'Los Cristales';
const TIEMPO_MINIMO_MS = 3000;  // submissions faster than this are rejected
const LIMITE_ENVIOS = 5;        // max accepted submissions per IP...
const VENTANA_SEGUNDOS = 600;   // ...within this window (10 minutes)
const CAMPO_TRAMPA = 'campo_control'; // honeypot field name
const CAMPO_TIEMPO = 'tiempo';        // elapsed milliseconds, set by script.js

const PAGINAS = [
    'contacto' => 'contacto.html',
    'reclamo' => 'libro-de-reclamaciones.html',
];

// Redirect targets for English submissions (the /en/ twins of PAGINAS).
const PAGINAS_EN = [
    'contacto' => '/en/contacto.html',
    'reclamo' => '/en/libro-de-reclamaciones.html',
];

const IDIOMAS = ['es', 'en'];
const CAMPO_IDIOMA = 'idioma'; // optional hidden field: es | en

/** Visitor-facing messages per language, keyed by a fixed identifier. */
const MENSAJES = [
    'es' => [
        'metodo' => 'Método no permitido.',
        'formulario' => 'No pudimos procesar el formulario. Inténtalo de nuevo.',
        'gracias' => 'Gracias, recibimos tu mensaje.',
        'rapido' => 'El formulario se envió demasiado rápido. Espera unos segundos e inténtalo de nuevo.',
        'campos' => 'Revisa los campos obligatorios e inténtalo de nuevo.',
        'limite' => 'Recibimos demasiados envíos desde tu conexión. Inténtalo de nuevo en unos minutos.',
        'contacto_error' => 'No pudimos enviar tu consulta. Inténtalo más tarde o escríbenos por WhatsApp.',
        'contacto_ok' => 'Gracias, recibimos tu consulta. Te contactaremos pronto.',
        'reclamo_error' => 'No pudimos registrar tu reclamo. Inténtalo más tarde o comunícate con nosotros por teléfono.',
        'pagina_titulo' => 'Reclamo registrado',
        'pagina_h1' => 'Reclamo registrado.',
        'pagina_volver' => 'Volver al Libro de Reclamaciones',
    ],
    'en' => [
        'metodo' => 'Method not allowed.',
        'formulario' => 'We could not process the form. Please try again.',
        'gracias' => 'Thank you, we have received your message.',
        'rapido' => 'The form was sent too quickly. Wait a few seconds and try again.',
        'campos' => 'Check the required fields and try again.',
        'limite' => 'We received too many submissions from your connection. Please try again in a few minutes.',
        'contacto_error' => 'We could not send your inquiry. Please try again later or message us on WhatsApp.',
        'contacto_ok' => 'Thank you, we have received your inquiry. We will get back to you soon.',
        'reclamo_error' => 'We could not register your complaint. Please try again later or contact us by phone.',
        'pagina_titulo' => 'Complaint registered',
        'pagina_h1' => 'Complaint registered.',
        'pagina_volver' => 'Back to the Complaints Book',
    ],
];

/**
 * Language of this request: set once from the whitelisted "idioma" field,
 * "es" until then (and for anything not in IDIOMAS).
 */
function idioma($nuevo = null)
{
    static $actual = 'es';
    if ($nuevo !== null && in_array($nuevo, IDIOMAS, true)) {
        $actual = $nuevo;
    }
    return $actual;
}

/** Visitor-facing message for the request language. */
function mensaje($clave)
{
    return MENSAJES[idioma()][$clave];
}

const TIPOS_DOCUMENTO = ['DNI', 'CE', 'Pasaporte', 'RUC'];

/**
 * Field whitelist per form. Keys are the HTML `name` attributes.
 * type: text | multiline | email | date | int | decimal | choice | check
 */
function definicion_campos($formulario)
{
    if ($formulario === 'contacto') {
        return [
            'nombre'   => ['label' => 'Nombre', 'type' => 'text', 'max' => 120, 'required' => true],
            'correo'   => ['label' => 'Correo electrónico', 'type' => 'email', 'max' => 254, 'required' => true],
            'telefono' => ['label' => 'Teléfono', 'type' => 'text', 'max' => 30, 'required' => false],
            'tour'     => ['label' => 'Tour de interés', 'type' => 'choice', 'max' => 80, 'required' => false,
                           'options' => ['Parque Nacional de Tingo María', 'Laguna de los Milagros', 'Catarata Honolulo', 'Otro / aún no lo sé']],
            'fecha'    => ['label' => 'Fecha tentativa', 'type' => 'date', 'max' => 10, 'required' => false],
            'personas' => ['label' => 'Número de personas', 'type' => 'int', 'max' => 4, 'required' => false],
            'mensaje'  => ['label' => 'Mensaje', 'type' => 'multiline', 'max' => 5000, 'required' => true],
            'acepto'   => ['label' => 'Acepta la política de privacidad y el tratamiento de datos', 'type' => 'check', 'max' => 10, 'required' => true],
        ];
    }

    if ($formulario === 'reclamo') {
        return [
            'nombre'          => ['label' => 'Nombre', 'type' => 'text', 'max' => 120, 'required' => true],
            'apellido1'       => ['label' => 'Primer apellido', 'type' => 'text', 'max' => 80, 'required' => true],
            'apellido2'       => ['label' => 'Segundo apellido', 'type' => 'text', 'max' => 80, 'required' => true],
            'tipo_doc'        => ['label' => 'Tipo de documento', 'type' => 'choice', 'max' => 20, 'required' => true, 'options' => TIPOS_DOCUMENTO],
            'num_doc'         => ['label' => 'Número de documento', 'type' => 'text', 'max' => 30, 'required' => true],
            'celular'         => ['label' => 'Celular', 'type' => 'text', 'max' => 30, 'required' => true],
            'departamento'    => ['label' => 'Departamento', 'type' => 'choice', 'max' => 20, 'required' => true,
                                  'options' => ['AMAZONAS', 'ANCASH', 'APURIMAC', 'AREQUIPA', 'AYACUCHO', 'CAJAMARCA',
                                                'CALLAO', 'CUSCO', 'HUANCAVELICA', 'HUANUCO', 'ICA', 'JUNIN',
                                                'LA LIBERTAD', 'LAMBAYEQUE', 'LIMA', 'LORETO', 'MADRE DE DIOS', 'MOQUEGUA',
                                                'PASCO', 'PIURA', 'PUNO', 'SAN MARTIN', 'TACNA', 'TUMBES', 'UCAYALI']],
            'provincia'       => ['label' => 'Provincia', 'type' => 'text', 'max' => 80, 'required' => true],
            'distrito'        => ['label' => 'Distrito', 'type' => 'text', 'max' => 80, 'required' => true],
            'direccion'       => ['label' => 'Dirección', 'type' => 'text', 'max' => 200, 'required' => true],
            'referencia'      => ['label' => 'Referencia', 'type' => 'text', 'max' => 200, 'required' => false],
            'correo'          => ['label' => 'Correo electrónico', 'type' => 'email', 'max' => 254, 'required' => true],
            'menor'           => ['label' => 'Menor de edad', 'type' => 'choice', 'max' => 5, 'required' => false, 'options' => ['Sí', 'No']],
            'tutor_nombre'    => ['label' => 'Tutor - Nombre', 'type' => 'text', 'max' => 160, 'required' => false],
            'tutor_correo'    => ['label' => 'Tutor - Correo electrónico', 'type' => 'email', 'max' => 254, 'required' => false],
            'tutor_tipo_doc'  => ['label' => 'Tutor - Tipo de documento', 'type' => 'choice', 'max' => 20, 'required' => false, 'options' => TIPOS_DOCUMENTO],
            'tutor_num_doc'   => ['label' => 'Tutor - Número de documento', 'type' => 'text', 'max' => 30, 'required' => false],
            'tipo_reclamo'    => ['label' => 'Tipo de reclamo', 'type' => 'choice', 'max' => 30, 'required' => true, 'options' => ['Reclamación (1)', 'Queja (2)']],
            'tipo_consumo'    => ['label' => 'Tipo de consumo', 'type' => 'choice', 'max' => 20, 'required' => true, 'options' => ['Producto', 'Servicio']],
            'pedido'          => ['label' => 'N.º de pedido', 'type' => 'text', 'max' => 80, 'required' => true],
            'fecha_reclamo'   => ['label' => 'Fecha de reclamación / queja', 'type' => 'date', 'max' => 10, 'required' => false],
            'proveedor'       => ['label' => 'Proveedor', 'type' => 'text', 'max' => 200, 'required' => false],
            'monto'           => ['label' => 'Monto reclamado (S/.)', 'type' => 'decimal', 'max' => 13, 'required' => false],
            'descripcion'     => ['label' => 'Descripción del producto o servicio', 'type' => 'text', 'max' => 300, 'required' => true],
            'fecha_compra'    => ['label' => 'Fecha de compra', 'type' => 'date', 'max' => 10, 'required' => false],
            'fecha_consumo'   => ['label' => 'Fecha de consumo', 'type' => 'date', 'max' => 10, 'required' => false],
            'fecha_caducidad' => ['label' => 'Fecha de caducidad', 'type' => 'date', 'max' => 10, 'required' => false],
            'detalle'         => ['label' => 'Detalle de la reclamación / queja', 'type' => 'multiline', 'max' => 5000, 'required' => true],
            'pedido_cliente'  => ['label' => 'Pedido del cliente', 'type' => 'multiline', 'max' => 3000, 'required' => true],
            'declaracion'     => ['label' => 'Declaración jurada de veracidad', 'type' => 'check', 'max' => 10, 'required' => true],
            'acepta_politicas' => ['label' => 'Acepta la política de privacidad y la protección de datos personales', 'type' => 'check', 'max' => 10, 'required' => true],
        ];
    }

    return [];
}

/* ---------- Helpers ---------- */

function quiere_json()
{
    $accept = isset($_SERVER['HTTP_ACCEPT']) ? (string) $_SERVER['HTTP_ACCEPT'] : '';
    $pedido = isset($_SERVER['HTTP_X_REQUESTED_WITH']) ? strtolower((string) $_SERVER['HTTP_X_REQUESTED_WITH']) : '';
    return strpos($accept, 'application/json') !== false || $pedido === 'fetch';
}

/**
 * Sends the response and stops. $formulario is always a whitelisted key or
 * '' (never raw input), so the redirect target is fixed.
 */
function responder($formulario, $ok, $estado, $mensaje, $mostrarMensaje = false)
{
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');

    if (quiere_json()) {
        http_response_code($estado);
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode(['ok' => (bool) $ok, 'message' => $mensaje], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    $paginas = idioma() === 'en' ? PAGINAS_EN : PAGINAS;
    $pagina = array_key_exists($formulario, $paginas) ? $paginas[$formulario] : $paginas['contacto'];

    // Without JS, a message that carries generated data (the claim number)
    // can't travel in a redirect fragment, so render it on a minimal page.
    if ($mostrarMensaje) {
        http_response_code($estado);
        header('Content-Type: text/html; charset=UTF-8');
        $texto = htmlspecialchars($mensaje, ENT_QUOTES, 'UTF-8');
        $hoja = idioma() === 'en' ? '/styles.css' : 'styles.css';
        echo '<!DOCTYPE html><html lang="' . idioma() . '"><head><meta charset="UTF-8">'
            . '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
            . '<meta name="theme-color" content="#000000"><meta name="color-scheme" content="dark">'
            . '<meta name="robots" content="noindex">'
            . '<title>' . mensaje('pagina_titulo') . ' | Los Cristales</title>'
            . '<link rel="stylesheet" href="' . $hoja . '"></head><body>'
            . '<main class="seccion"><div class="contenedor"><div class="bloque legal">'
            . '<h1>' . mensaje('pagina_h1') . '</h1><p role="status">' . $texto . '</p>'
            . '<p><a class="boton" href="' . $pagina . '">' . mensaje('pagina_volver') . '</a></p>'
            . '</div></div></main></body></html>';
        exit;
    }

    header('Location: ' . $pagina . ($ok ? '#enviado' : '#error'), true, 303);
    exit;
}

function es_utf8($valor)
{
    if (function_exists('mb_check_encoding')) {
        return mb_check_encoding($valor, 'UTF-8');
    }
    return preg_match('//u', $valor) === 1;
}

function longitud($valor)
{
    if (function_exists('mb_strlen')) {
        return mb_strlen($valor, 'UTF-8');
    }
    return (int) preg_match_all('/./us', $valor);
}

/** Removes CR, LF and NUL: for any value placed in a mail header. */
function sin_saltos($valor)
{
    return str_replace(["\r", "\n", "\0"], '', (string) $valor);
}

/**
 * Normalizes a (valid UTF-8) value: drops NUL and control characters,
 * unifies line breaks, flattens single-line fields and trims.
 */
function limpiar($valor, $multilinea)
{
    $valor = str_replace(["\r\n", "\r"], "\n", $valor);
    if (!$multilinea) {
        $valor = str_replace(["\n", "\t"], ' ', $valor);
    }
    $limpio = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $valor);
    return trim($limpio === null ? '' : $limpio);
}

function fecha_valida($valor)
{
    if (!preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $valor, $m)) {
        return false;
    }
    return checkdate((int) $m[2], (int) $m[3], (int) $m[1]);
}

/**
 * Reads and validates the whitelisted fields of one form.
 * Returns the cleaned values, or null if anything is invalid.
 */
function validar($campos)
{
    $valores = [];
    foreach ($campos as $nombre => $campo) {
        $bruto = isset($_POST[$nombre]) ? $_POST[$nombre] : '';
        if (!is_string($bruto) || !es_utf8($bruto)) {
            return null;
        }
        $valor = limpiar($bruto, $campo['type'] === 'multiline');

        if ($valor === '') {
            if ($campo['required']) {
                return null;
            }
            $valores[$nombre] = '';
            continue;
        }
        if (longitud($valor) > $campo['max']) {
            return null;
        }

        switch ($campo['type']) {
            case 'email':
                if (filter_var($valor, FILTER_VALIDATE_EMAIL) === false) {
                    return null;
                }
                break;
            case 'date':
                if (!fecha_valida($valor)) {
                    return null;
                }
                break;
            case 'int':
                if (!preg_match('/^\d{1,4}$/', $valor) || (int) $valor < 1) {
                    return null;
                }
                break;
            case 'decimal':
                if (!preg_match('/^\d{1,9}(\.\d{1,2})?$/', $valor)) {
                    return null;
                }
                break;
            case 'choice':
                if (!in_array($valor, $campo['options'], true)) {
                    return null;
                }
                break;
            case 'check':
                $valor = 'Sí';
                break;
        }
        $valores[$nombre] = $valor;
    }
    return $valores;
}

/** dd/mm/yyyy for display; other values unchanged. */
function mostrar($tipo, $valor)
{
    if ($valor === '') {
        return '-';
    }
    if ($tipo === 'date') {
        list($a, $m, $d) = explode('-', $valor);
        return $d . '/' . $m . '/' . $a;
    }
    return $valor;
}

/** Labeled plain-text listing of every field. */
function listado($campos, $valores)
{
    $lineas = [];
    foreach ($campos as $nombre => $campo) {
        $valor = mostrar($campo['type'], $valores[$nombre]);
        if ($campo['type'] === 'multiline') {
            $lineas[] = '';
            $lineas[] = $campo['label'] . ':';
            $lineas[] = $valor;
            $lineas[] = '';
        } else {
            $lineas[] = $campo['label'] . ': ' . $valor;
        }
    }
    return implode("\n", $lineas);
}

/**
 * Keeps every body line under the SMTP limit (998 bytes) without breaking
 * multibyte characters: only very long lines are split, every 200 characters.
 */
function ajustar_lineas($texto)
{
    $salida = [];
    foreach (explode("\n", $texto) as $linea) {
        if (strlen($linea) <= 900) {
            $salida[] = $linea;
            continue;
        }
        if (preg_match_all('/.{1,200}/us', $linea, $partes)) {
            foreach ($partes[0] as $parte) {
                $salida[] = $parte;
            }
        }
    }
    return implode("\n", $salida);
}

function codificar_asunto($asunto)
{
    $asunto = sin_saltos($asunto);
    if (function_exists('mb_encode_mimeheader')) {
        return mb_encode_mimeheader($asunto, 'UTF-8', 'B', "\r\n");
    }
    return '=?UTF-8?B?' . base64_encode($asunto) . '?=';
}

/**
 * Sends one plain-text UTF-8 message. $para and $responderA must already be
 * validated addresses (or '' for no Reply-To); CR/LF are stripped anyway.
 */
function enviar_correo($para, $asunto, $cuerpo, $responderA)
{
    $cabeceras = [
        'From: ' . REMITENTE_NOMBRE . ' <' . REMITENTE . '>',
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
    ];
    $responderA = sin_saltos($responderA);
    if ($responderA !== '' && filter_var($responderA, FILTER_VALIDATE_EMAIL) !== false) {
        $cabeceras[] = 'Reply-To: ' . $responderA;
    }

    return @mail(
        sin_saltos($para),
        codificar_asunto($asunto),
        ajustar_lineas($cuerpo),
        implode("\r\n", $cabeceras),
        '-f' . REMITENTE
    );
}

/**
 * Per-IP rate limit: true when the IP already reached LIMITE_ENVIOS within
 * VENTANA_SEGUNDOS; otherwise records this attempt. Any filesystem problem
 * (unwritable temp dir, open_basedir, locking) fails open.
 */
function limite_superado($ip)
{
    $dir = sys_get_temp_dir();
    if ($ip === '' || !is_string($dir) || $dir === '' || !@is_writable($dir)) {
        return false;
    }
    $archivo = rtrim($dir, '/\\') . DIRECTORY_SEPARATOR . 'lc_formularios_' . hash('sha256', $ip) . '.txt';
    $fp = @fopen($archivo, 'c+');
    if ($fp === false) {
        return false;
    }
    if (!@flock($fp, LOCK_EX)) {
        fclose($fp);
        return false;
    }

    $ahora = time();
    $marcas = [];
    foreach (explode("\n", (string) stream_get_contents($fp)) as $linea) {
        $t = (int) $linea;
        if ($t > $ahora - VENTANA_SEGUNDOS) {
            $marcas[] = $t;
        }
    }
    $superado = count($marcas) >= LIMITE_ENVIOS;
    if (!$superado) {
        $marcas[] = $ahora;
    }
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, implode("\n", $marcas));
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
    return $superado;
}

function numero_reclamo(DateTime $fecha)
{
    try {
        $sufijo = strtoupper(bin2hex(random_bytes(2)));
    } catch (Exception $e) {
        $sufijo = strtoupper(str_pad(dechex(mt_rand(0, 0xFFFF)), 4, '0', STR_PAD_LEFT));
    }
    return 'LR-' . $fecha->format('Ymd-His') . '-' . $sufijo;
}

/* ---------- Request ---------- */

if (function_exists('mb_internal_encoding')) {
    mb_internal_encoding('UTF-8');
}

$metodo = isset($_SERVER['REQUEST_METHOD']) ? strtoupper((string) $_SERVER['REQUEST_METHOD']) : '';
if ($metodo !== 'POST') {
    header('Allow: POST');
    if (quiere_json()) {
        responder('', false, 405, mensaje('metodo'));
    }
    header('Cache-Control: no-store');
    header('Location: contacto.html', true, 303);
    exit;
}

// Visitor language (whitelisted; anything else keeps the Spanish default).
if (isset($_POST[CAMPO_IDIOMA]) && is_string($_POST[CAMPO_IDIOMA])) {
    idioma(strtolower(trim($_POST[CAMPO_IDIOMA])));
}

$formulario = isset($_POST['formulario']) && is_string($_POST['formulario']) ? $_POST['formulario'] : '';
if (!array_key_exists($formulario, PAGINAS)) {
    responder('', false, 400, mensaje('formulario'));
}

// Honeypot: humans never see this field. Pretend success and send nothing.
$trampa = isset($_POST[CAMPO_TRAMPA]) ? $_POST[CAMPO_TRAMPA] : '';
if (!is_string($trampa) || trim($trampa) !== '') {
    responder($formulario, true, 200, mensaje('gracias'));
}

// Minimum fill time, reported by script.js (absent without JS: skipped).
$tiempo = isset($_POST[CAMPO_TIEMPO]) && is_string($_POST[CAMPO_TIEMPO]) ? trim($_POST[CAMPO_TIEMPO]) : '';
if ($tiempo !== '' && preg_match('/^\d{1,12}$/', $tiempo) && (int) $tiempo < TIEMPO_MINIMO_MS) {
    responder($formulario, false, 400, mensaje('rapido'));
}

$campos = definicion_campos($formulario);
$valores = validar($campos);
if ($valores === null) {
    responder($formulario, false, 400, mensaje('campos'));
}

$ip = isset($_SERVER['REMOTE_ADDR']) ? (string) $_SERVER['REMOTE_ADDR'] : '';
if (limite_superado($ip)) {
    responder($formulario, false, 429, mensaje('limite'));
}

$ahora = new DateTime('now', new DateTimeZone('America/Lima'));
$fechaHora = $ahora->format('d/m/Y H:i') . ' (hora de Lima)';

if ($formulario === 'contacto') {
    $cuerpo = "Nueva consulta desde el formulario de contacto de la web.\n"
        . "Formulario: Contacto\n"
        . 'Idioma: ' . idioma() . "\n"
        . 'Fecha y hora: ' . $fechaHora . "\n\n"
        . listado($campos, $valores) . "\n";

    // The required email is already validated, so replies go straight to the visitor.
    $responderA = $valores['correo'];

    if (!enviar_correo(DESTINO, 'Consulta web - Los Cristales', $cuerpo, $responderA)) {
        error_log('enviar.php: mail() failed (formulario=contacto)');
        responder($formulario, false, 500, mensaje('contacto_error'));
    }
    responder($formulario, true, 200, mensaje('contacto_ok'));
}

// Libro de Reclamaciones
$numero = numero_reclamo($ahora);
$hoja = 'Número de reclamo: ' . $numero . "\n"
    . 'Fecha y hora: ' . $fechaHora . "\n"
    . "Proveedor: CORPORACIÓN TULUMAYO MYSTIC S.A.C. (Los Cristales) - RUC 20616494750\n\n"
    . listado($campos, $valores) . "\n";

$cuerpo = "Nuevo reclamo registrado en el Libro de Reclamaciones virtual de la web.\n"
    . "Formulario: Libro de Reclamaciones\n"
    . 'Idioma: ' . idioma() . "\n\n"
    . $hoja;

if (!enviar_correo(DESTINO, 'Libro de Reclamaciones ' . $numero . ' - Los Cristales', $cuerpo, $valores['correo'])) {
    error_log('enviar.php: mail() failed (formulario=reclamo)');
    responder($formulario, false, 500, mensaje('reclamo_error'));
}

// Copy for the consumer, with the same claim number, in the visitor's
// language. The complaint sheet itself keeps its Spanish labels: it is the
// registered document.
if (idioma() === 'en') {
    $asuntoCopia = 'Copy of your complaint ' . $numero . ' - Los Cristales';
    $copia = 'Hello, ' . $valores['nombre'] . ":\n\n"
        . "We have received your complaint in the virtual Complaints Book (Libro de Reclamaciones) of Los Cristales.\n"
        . "Please keep this email as proof; below is a copy of your complaint sheet (the sheet keeps its original Spanish labels).\n\n"
        . $hoja . "\n"
        . "The provider must reply to the complaint within fifteen (15) calendar days at most, and may extend that period by up to another fifteen days.\n"
        . "Filing a complaint does not exclude other means of dispute resolution, nor is it a prerequisite for filing a report with Indecopi.\n";
} else {
    $asuntoCopia = 'Copia de tu reclamo ' . $numero . ' - Los Cristales';
    $copia = 'Hola, ' . $valores['nombre'] . ":\n\n"
        . "Hemos recibido tu reclamo en el Libro de Reclamaciones virtual de Los Cristales.\n"
        . "Conserva este correo como constancia; a continuación encontrarás una copia de tu hoja de reclamación.\n\n"
        . $hoja . "\n"
        . "El proveedor debe responder a la reclamación en un plazo no superior a quince (15) días naturales, pudiendo ampliar el plazo hasta quince días más.\n"
        . "La formulación del reclamo no excluye el recurso a otros medios de resolución de controversias ni es un requisito previo para presentar una denuncia ante el Indecopi.\n";
}

if (!enviar_correo($valores['correo'], $asuntoCopia, $copia, DESTINO)) {
    error_log('enviar.php: mail() failed (formulario=reclamo, consumer copy)');
    responder($formulario, true, 200, idioma() === 'en'
        ? 'Your complaint was registered with number ' . $numero . '. We could not email you a copy: please keep this number.'
        : 'Tu reclamo fue registrado con el número ' . $numero . '. No pudimos enviarte la copia por correo: guarda este número.', true);
}
responder($formulario, true, 200, idioma() === 'en'
    ? 'Your complaint was registered with number ' . $numero . '. We emailed a copy to your email address.'
    : 'Tu reclamo fue registrado con el número ' . $numero . '. Te enviamos una copia a tu correo electrónico.', true);
