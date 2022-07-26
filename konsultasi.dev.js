
let CORE_KONSULTASI = {
    PUSHER : {
        key : '5b80184ebd7cef734882',
        channel : 'Chat-Testing',
        my_event : 'testing-oyy',
        cluster : 'ap1',
    },
    kategori : 'konsultasi',
    sedang_konsultasi : false,
    room_id : '',
    my_id : '',
    my_name : '',
    my_email : '',
    my_telp : '',
    
    mulai : function(data, my_callback=null){
        data.sedang_konsultasi = true;
        let session_konsultasi = JSON.stringify(data);
        localStorage.setItem('session_konsultasi', session_konsultasi);
        this.refresh();


        $.ajax({
            type: "POST",
            url: KONSULTASI_BASE_ROOT.BASE_API+"create_room",
            dataType: "JSON",
            data: {
                kategori : KONSULTASI_BASE_ROOT.get_kategori_konsultasi(),
                status : 'mulai',
                catatan : 'Client memulai konsultasi',
                nama_customer : this.my_name,
                email_customer : this.my_email,
                telepon_customer : this.my_telp,
            },
            success: function (response) {
                if(!response.success){
                    alert('Terjadi error di Server saat memulai konsultasi')
                    console.error('Terjadi error di Server saat memulai konsultasi')
                    return
                }

                console.log('AFTER CRETAE ROOM ', response)

                // Set Variable Root 
                let session_konsultasi = JSON.parse(localStorage.getItem('session_konsultasi'))
                session_konsultasi.room_id = response.data.slug;
                localStorage.setItem('session_konsultasi', JSON.stringify(session_konsultasi));
                CORE_KONSULTASI.refresh();

                // Realtime Chat
                CORE_KONSULTASI.set_realtime_chat();

                if (typeof my_callback == "function") my_callback();
            }
        });
    },

    akhiri : function(success_callback=null){
        $.ajax({
            type: "POST",
            url: KONSULTASI_BASE_ROOT.BASE_API+"update_room/"+this.room_id,
            data: {
                status : 'selesai',
                catatan : 'Client mengakhiri konsultasi',
                rating : null,
            },
            dataType: "JSON",
            success: function (response) {
                if(!response.success){
                    alert('Terjadi error di Server saat memulai konsultasi')
                    console.error('Terjadi error di Server saat memulai konsultasi')
                    return
                }

                channel.unbind_global();

                console.log('Channel di akhiri')
        
                let session_konsultasi = {
                    sedang_konsultasi : false,
                    kategori: 'konsultasi',
                    room_id : '',
                    my_id : '',
                    my_name : '',
                    my_email : '',
                    my_telp : '',
                }
                localStorage.setItem('session_konsultasi', JSON.stringify(session_konsultasi));
                CORE_KONSULTASI.refresh();

                if (typeof success_callback == "function") success_callback();
            }
        });
    },

    get_list_chat_in_room : function (is_set_chat=false){
        $.ajax({
            type: "POST",
            url: KONSULTASI_BASE_ROOT.BASE_API+"chats_in_room/"+this.room_id,
            dataType: "JSON",
            success: function (response) {
                if(!response.success){
                    alert(`Gagal mendapatkan riwayat chat kamu`)
                    console.error(`Gagal mendapatkan riwayat chat kamu`)
                    return false
                }

                if(!is_set_chat) return response.data;

                response.data.map(chat => CORE_KONSULTASI.render_chat(chat));
            }
        });
    },

    set_realtime_chat : function(){
        channel.bind('Room.'+this.room_id, function(data) {
            console.log('Pesan datang : ', data)

            if(data.hasOwnProperty('type') && data.hasOwnProperty('command')){
                CORE_KONSULTASI.render_chat(data.data, data.command);
                return
            }

            CORE_KONSULTASI.render_chat(data);
        });
    },

    render_chat: function(data, type_chat='chat'){
        // ${(data.media)? `<img src="/${data.media}" alt="">` : ``}

        switch (type_chat) {
            case 'CONNECTED_WITH_CS':
                $(".chat-box").last().append(`
                    <span class="hr-text-center">Anda sudah terhubung dengan CS Kami</span>
                `);

                $("#container_chat .nama_cs").html(`<u>${data.nama_cs}</u>`)
                // $("#container_chat .photo_cs").prop('src', data.photo_cs)
                
                break;
            case 'END_SESSION':
                $(".chat-box").last().append(`
                    <span class="hr-text-center">CS Mengakhiri Session ini...</span>
                `);
                break;
            case "chat":
            default:
                $(".chat-box").last().append(`
                    <div class="chat ${(data.id_user_from)? `incoming` : `outgoing`}" id="${data.slug}">
                        ${(data.id_user_from)? `<img src="cs2.jpg" class="photo_cs" alt="">` : ``}
                        <div class="details">
                            <p>${data.chat}</p>
                        </div>
                    </div>
                `);
                if(data.id_user_from){
                    $(".chat-box").animate({
                        scrollTop: $(".chat.incoming").last().position().top
                    }, 200);
                } else {
                    $(".chat-box").animate({
                        scrollTop: $(".chat.outgoing").last().position().top
                    }, 200);
                }
                break;
        }
        

    },

    kirim_pesan : function(pesan, media=null, my_callback=null){
        $.ajax({
            type: "POST",
            url: KONSULTASI_BASE_ROOT.BASE_API+"create_chat/"+this.room_id,
            data: {
                chat : pesan,
                media : media,
            },
            dataType: "JSON",
            success: function (response) {
                if(!response.success){
                    alert(`Pesan '${pesan}' gagal terkirim`)
                    console.error(`Pesan '${pesan}' gagal terkirim`)
                    return
                }

                if (typeof my_callback == "function") my_callback();
            }
        });
    },

    refresh: function(my_callback=null){
        let data = JSON.parse(localStorage.getItem('session_konsultasi'))
        if(data==null || data==''){
            this.sedang_konsultasi = false;
            this.kategori = 'konsultasi';
            this.room_id = '';
            this.my_id = '';
            this.my_name = '';
            this.my_email = '';
            this.my_telp = '';
        } else {
            this.sedang_konsultasi = data.sedang_konsultasi;
            this.kategori = data.kategori;
            this.room_id = data.room_id;
            this.my_id = data.my_id;
            this.my_name = data.my_name;
            this.my_email = data.my_email;
            this.my_telp = data.my_telp;
        }

        this.kategori = KONSULTASI_BASE_ROOT.get_kategori_konsultasi;
        if (typeof my_callback == "function") my_callback();
    },

    destroy_session: function(){
        localStorage.clear();
        this.refresh();
    }
}

const KONSULTASI_BASE_ROOT = {
    BASE_URL_CHAT : 'http://13.212.254.235/',
    BASE_API : 'http://13.212.254.235/api/chat/',
    link_css : 'http://13.212.254.235/assets/konsultasi/konsultasi.css',
    link_js : 'http://13.212.254.235/assets/konsultasi/konsultasi.dev.js',


    generate_link_css_to_browser : function(){
        $("head").last().append(`<link rel="stylesheet" href="${this.link_css}">`);
    },

    generate_custom_link_js_to_browser : function(my_link_js){
        $("head").last().append(`<script src="${my_link_js}"></script>`);
    },

    generate_template_konsultasi : function(){
        this.generate_link_css_to_browser();

        let html_template = `
            <input type="checkbox" id="click_popchat">
                <label for="click_popchat" class="label_click_popchat">
                <i class="fab fa-facebook-messenger"></i>
                <i class="fas fa-times"></i>
            </label>

            <div class="wrapper_popchat">
            <section class="form" id="container_faq">
                <form action="#" method="POST" enctype="multipart/form-data" autocomplete="off" id="form_search_faq" style="margin-top: 0;">
                    <header style="padding-bottom:0;">
                        <h1 class="title-card">Pusat Bantuan</h1>
                        <div class="field input">
                            <input type="text" name="search" placeholder="Masukkan kata kunci">
                            <i class="fas fa-search" style="top:50%"></i>
                        </div>
                    </header>
                    <div class="area-list-faq">
                        <ol class="list-faq">
                            <li><a href="javascript:showing_el('#detail_faq')">Mengapa Layanan Sunat di Dr. Mahdian sangat mahal?</a></li>
                            <li><a href="javascript:showing_el('#detail_faq')">Apa Keuntungan Sunat?</a></li>
                            <li><a href="javascript:showing_el('#detail_faq')">Benarkah jika tidak disunat akan menjadi kanker?</a></li>
                            <li><a href="javascript:showing_el('#detail_faq')">Apabila sudah lansia, haruskah disunat?</a></li>
                            <li><a href="javascript:showing_el('#detail_faq')">Bayi umur berapa agar siap disunat?</a></li>
                        </ol>
                    </div>
                </form>
                <button class="button-live-chat" onclick="showing_el('#container_start_chat')">Live Chat</button>
            </section>

            <section class="chat-area" id="detail_faq" style="display: none;">
                <header>
                <a onclick="showing_el('#container_faq')" class="back-icon"><i class="fas fa-arrow-left"></i></a>
                <div class="details" style="margin-left: 5px;">
                    <span>Kembali</span>
                </div>
                </header>
                
                <!-- Mulai Chat -->
                <div class="chat-box">
                    <h3 style="margin-bottom: 10px;">Mengapa Layanan Sunat di Dr. Mahdian sangat mahal?</h3>

                    <p>Sunat di Rumah Sunatan Dr. Mahdian menggunakan teknologi modern, </p>

                    <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quam, sit obcaecati est nam, nisi totam debitis repellendus autem doloribus dolores, delectus magni? Minima itaque vero ipsam alias nesciunt sint ab!</p>
                </div>

                <form action="#" class="typing-area">
                Apakah Jawaban ini membantu? <i class="fas fa-fw fa-thumbs-up"></i> <i class="fas fa-fw fa-thumbs-down"></i>
                </form>
            </section>

            <section class="form" id="container_start_chat" style="display: none;">
                <header>
                    <a onclick="showing_el('#container_faq')" class="back-icon" style="margin-right: 5px; cursor: pointer;"><i class="fas fa-arrow-left"></i></a>
                    Chat dengan kami
                </header>
                <form action="#" method="POST" enctype="multipart/form-data" autocomplete="off" id="form_start_chat">
                    <div class="error-text"></div>
                    <div class="field input">
                    <label>Nama</label>
                    <input type="text" name="nama" placeholder="Masukkan Nama kamu" required>
                    </div>
                    <div class="field input">
                    <label>Email</label>
                    <input type="text" name="email" placeholder="Masukkan Alamat Email kamu" required>
                    </div>
                    <div class="field input">
                    <label>No. Whatsapp</label>
                    <input type="tel" name="no_wa" placeholder="Nomor Whatsapp aktif kamu" required>
                    <!-- <i class="fas fa-eye"></i> -->
                    </div>
                    <div class="field button">
                    <input type="submit" name="submit" value="Mulai Chat">
                    </div>
                </form>
            </section>

            <section class="chat-area" id="container_chat" style="display: none;">
                <header>
                    <a onclick="akhiri_session_chat()" class="back-icon"><i class="fas fa-arrow-left"></i></a>
                    <img src="cs2.jpg" class="photo_cs" alt="">
                    <div class="details">
                    <span class="nama_cs">Mahdikur</span>
                    <p>Customer Service</p>
                    </div>
                </header>

                <!-- Mulai Chat -->
                <div class="chat-box">
                    <!-- <div class="chat incoming">
                        <img src="cs2.jpg" alt="">
                        <div class="details">
                            <p>Produk Mana yang anda ingin ketahui lebih jauh</p>
                            <button onclick="handle_pilihan_chat('Sunat Dewasa')">Sunat Dewasa</button>
                            <button onclick="handle_pilihan_chat('Sunat Anak')">Sunat Anak</button>
                            <button onclick="handle_pilihan_chat('Sunat Perempuan')">Sunat Perempuan</button>
                            <button onclick="handle_pilihan_chat('Sunat Gemuk')">Sunat Gemuk</button>
                        </div>
                    </div>

                    <div class="chat outgoing">
                        <div class="details">
                            <p>Hallo</p>
                        </div>
                    </div> -->
                    <span class="hr-text-center">Mohon menunggu, kamu dalam antrian</span>

                </div>

                <form class="typing-area" method="post" id="form_chat">
                    <input type="text" class="incoming_id" name="incoming_id" value="user_id" hidden>
                    <input type="text" name="message" class="input-field" placeholder="Tulis pesan disini..." autocomplete="off">
                    <!-- <button><i class="fab fa-whatsapp"></i></button> -->
                    <button type="submit" id="btn_send_chat"><i class="fab fa-telegram-plane"></i></button>
                </form>
            </section>
            </div>
        `
        $("script").first().before(html_template);
    },

    cek_tag_js_exist : function (){
        let my_tag_script = $(`script[src="${this.link_js}"]`).length;
        if(my_tag_script < 1){
            // console.log(`Script ${this.link_js} di Browser tidak ada!`)
            console.error(`Script ${this.link_js} di Browser tidak ada!`)
            return false
        }

        console.log(`Script ${this.link_js} di Browser ada!`)
        return true
    },

    get_kategori_konsultasi : function (set_to_core=false){
        if(this.cek_tag_js_exist){
            let data_kategori = $(`script[src="${KONSULTASI_BASE_ROOT.link_js}"][data-kategori-konsultasi]`);

            if(data_kategori.length < 1) {
                // return CORE_KONSULTASI.kategori;
                // return 'konsultasi';
                console.error(`Script ${this.link_js} tidak memiliki atribute data-kategori-konsultasi`)
                return false
            }

            if(set_to_core) CORE_KONSULTASI.kategori = data_kategori.attr('data-kategori-konsultasi');

            return data_kategori.attr('data-kategori-konsultasi');
        }
    }
}


/////////////////////////////////////
// REALTIME CHAT
/////////////////////////////////////
Pusher.logToConsole = true;
let pusher  = new Pusher(CORE_KONSULTASI.PUSHER.key, { cluster: CORE_KONSULTASI.PUSHER.cluster });
let channel = pusher.subscribe(CORE_KONSULTASI.PUSHER.channel);



/////////////////////////////////////
// REQUIREMENT
/////////////////////////////////////

// Menambahkan Script di Head
// $("head").last().append(`<script src="https://cdnjs.cloudflare.com/ajax/libs/uuid/8.1.0/uuidv4.min.js"></script>`);
function uuidv4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

$(document).ready(function () {
    // Passing Template Konsultasi to File
    KONSULTASI_BASE_ROOT.generate_template_konsultasi();



    // Periksa Atribute Script
    CORE_KONSULTASI.refresh(function(){
        if(CORE_KONSULTASI.sedang_konsultasi){
            CORE_KONSULTASI.set_realtime_chat();
            showing_el('#container_chat');

            CORE_KONSULTASI.get_list_chat_in_room(true);
        }
    })


    $('#form_start_chat').on('submit', function (e) {
        e.preventDefault();

        $('#form_start_chat').find('input[type=submit]').val('Mohon menunggu...').prop('disabled',true)
        CORE_KONSULTASI.mulai({
            kategori: KONSULTASI_BASE_ROOT.get_kategori_konsultasi(true),
            my_name : $(this).find('input[name=nama]').val(),
            my_email : $(this).find('input[name=email]').val(),
            my_telp : $(this).find('input[name=no_wa]').val(),
        }, function() {
            showing_el('#container_chat');
            $('#form_start_chat').find('input[type=submit]').val('Mulai Chat').prop('disabled',false)
        });
        
    });

    $('#form_chat').on('submit', function (e) {
        if($(this).find('input[name=message]').val() == '') return false
        // e.preventDefault();

        $('#btn_send_chat').html(`<i class="fas fa-spin fa-spinner"></i>`)

        CORE_KONSULTASI.kirim_pesan($(this).find('input[name=message]').val(), null, function(){
            $('#form_chat').find('input[name=message]').val('');
            $('#btn_send_chat').html(`<i class="fab fa-telegram-plane"></i>`)
        })
        // showing_el('#container_chat');
        return false;
    });

    // $('#btn_send_chat').click(function (e) { 
    //     $('#form_chat').trigger('submit');
    // });
});

function hide_all(){
    $('#container_start_chat').slideUp();
    $('#container_chat').slideUp();
    $('#container_faq').slideUp();
    $('#detail_faq').slideUp();
}

function showing_el(target_id, is_confirm=false, $msg=''){
    if(is_confirm){
        let konfirmasi = confirm($msg);
        if(konfirmasi){
            hide_all()
            $(target_id).slideDown()
        }
    } else {
        hide_all()
        $(target_id).slideDown();
    }
}

function scroll_to_bottom(el){
    let container_el = $(el)
    container_el.scrollTop = container_el.scrollHeight;
}

function handle_pilihan_chat(str){
    $(".chat-box").last().append(`
        <div class="chat outgoing">
            <div class="details">
                <p>${str}</p>
            </div>
        </div>
    `);
    // scroll_to_bottom(".chat-box");
    $(".chat-box").animate({
        scrollTop: $(".chat.outgoing").last().position().top
    }, 1000);

    // Balasan
    setTimeout(function(){
        $(".chat-box").last().append(`
            <div class="chat incoming">
                <img src="cs2.jpg" alt="">
                <div class="details">
                    <p>Mohon menunggu ...</p>
                </div>
            </div>
        `);
        // scroll_to_bottom(".chat-box");
        $(".chat-box").animate({
            scrollTop: $(".chat.incoming").last().position().top
        }, 1000);
    },500);

    setTimeout(function(){
        $(".chat-box").last().append(`
            <div class="chat incoming">
                <img src="cs2.jpg" alt="">
                <div class="details">
                    <p>Apa yang kamu cari sebenarnya?</p>
                    <button onclick="handle_pilihan_chat('Harga')">Harga</button>
                    <button onclick="handle_pilihan_chat('Hadiah')">Hadiah</button>
                    <button onclick="handle_pilihan_chat('Diskon')">Diskon</button>
                    <button onclick="handle_pilihan_chat('Klinik')">Klinik</button>
                </div>
            </div>
        `);
        // scroll_to_bottom(".chat-box");
        $(".chat-box").animate({
            scrollTop: $(".chat.incoming").last().position().top
        }, 200);
    },2500);
}

function akhiri_session_chat(){
    let conf = confirm('Yakin akan mengakhiri session chat ini?');
    if(conf) {
        CORE_KONSULTASI.akhiri();
        CORE_KONSULTASI.refresh(function(){
            showing_el('#container_faq');
            $('#container_chat .chat-box').html(`<span class="hr-text-center">Mohon menunggu, kamu dalam antrian</span>`)
        })
    }
}