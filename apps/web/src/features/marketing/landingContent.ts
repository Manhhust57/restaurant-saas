export type LandingBenefit = {
    title: string;
    description: string;
};

export type LandingFaq = {
    question: string;
    answer: string;
};

export type LandingPageContent = {
    path: string;
    eyebrow: string;
    title: string;
    titleHighlight: string;
    lead: string;
    metaTitle: string;
    metaDescription: string;
    benefitsTitle: string;
    benefitsLead: string;
    benefits: LandingBenefit[];
    howTitle: string;
    howSteps: Array<{ num: string; title: string; description: string }>;
    audienceTitle: string;
    audience: string[];
    faqTitle: string;
    faqs: LandingFaq[];
    ctaTitle: string;
    ctaLead: string;
    related: Array<{ path: string; label: string; description: string }>;
};

export const LANDING_PAGES: LandingPageContent[] = [
    {
        path: '/phan-mem-goi-mon-qr',
        eyebrow: 'Phần mềm gọi món QR',
        title: 'Phần mềm gọi món QR',
        titleHighlight: 'cho quán ăn, nhà hàng',
        lead: 'Khách quét mã tại bàn để xem menu và đặt món ngay trên điện thoại. Đơn gửi realtime tới thu ngân và bếp, giảm chờ đợi và tăng vòng quay bàn.',
        metaTitle: 'Phần mềm gọi món QR cho quán ăn, nhà hàng | TQM',
        metaDescription:
            'Phần mềm gọi món bằng QR cho quán ăn và nhà hàng: khách tự đặt món tại bàn, đồng bộ đơn realtime tới POS và bếp. Triển khai nhanh, dùng ngay.',
        benefitsTitle: 'Lợi ích khi dùng gọi món QR',
        benefitsLead:
            'Phù hợp quán ăn, quán nhậu, cà phê và nhà hàng muốn giảm tải phục vụ mà vẫn kiểm soát đơn rõ ràng.',
        benefits: [
            {
                title: 'Khách đặt món không cần app',
                description:
                    'Chỉ cần quét QR trên bàn. Không cài đặt, không đăng ký tài khoản, trải nghiệm gần gũi với cách dùng điện thoại hàng ngày.',
            },
            {
                title: 'Giảm thời gian chờ gọi món',
                description:
                    'Nhân viên không phải ghi order tay từng bàn. Khách tự chọn món, gửi đơn và theo dõi trạng thái nhanh hơn.',
            },
            {
                title: 'Đơn về bếp realtime',
                description:
                    'Mỗi món đặt xong đều đẩy ngay tới màn hình bếp và POS, hạn chế sót đơn trong giờ cao điểm.',
            },
            {
                title: 'Menu luôn đúng giá và trạng thái',
                description:
                    'Cập nhật món hết, đổi giá, thêm combo trên hệ thống quản trị là khách thấy ngay trên menu QR.',
            },
            {
                title: 'Tăng vòng quay bàn',
                description:
                    'Gọi món nhanh hơn giúp bàn trống sớm hơn, đặc biệt hữu ích với quán đông khách cuối tuần.',
            },
            {
                title: 'Dữ liệu đơn tập trung',
                description:
                    'Mọi đơn từ QR, POS và bếp nằm trên một hệ thống, dễ đối soát và theo dõi doanh thu theo ngày.',
            },
        ],
        howTitle: 'Cách triển khai gọi món QR với TQM',
        howSteps: [
            {
                num: '01',
                title: 'Tạo thực đơn',
                description: 'Nhập danh mục, món ăn, giá và hình ảnh trên trang quản trị.',
            },
            {
                num: '02',
                title: 'Gắn QR theo bàn',
                description: 'Mỗi bàn có mã QR riêng dẫn tới menu và gửi đơn đúng bàn đó.',
            },
            {
                num: '03',
                title: 'Mở POS & bếp',
                description: 'Thu ngân và bếp nhận đơn realtime khi khách gửi món.',
            },
            {
                num: '04',
                title: 'Theo dõi vận hành',
                description: 'Xem số đơn, bàn đang phục vụ và báo cáo để tối ưu ca làm.',
            },
        ],
        audienceTitle: 'Phù hợp với những mô hình nào?',
        audience: [
            'Quán ăn gia đình muốn giảm ghi order tay',
            'Quán nhậu / lẩu / nướng đông khách giờ cao điểm',
            'Nhà hàng nhiều bàn cần đồng bộ bếp rõ ràng',
            'Chuỗi nhỏ muốn quản lý nhiều chi nhánh trên một phần mềm',
        ],
        faqTitle: 'Câu hỏi thường gặp về gọi món QR',
        faqs: [
            {
                question: 'Khách có cần tải app không?',
                answer: 'Không. Khách chỉ cần camera điện thoại để quét QR và mở menu trên trình duyệt.',
            },
            {
                question: 'Gọi món QR có thay được thu ngân không?',
                answer: 'Không thay hoàn toàn. QR giúp khách tự đặt món; POS vẫn dùng để thu tiền, chỉnh đơn và hỗ trợ tại quầy.',
            },
            {
                question: 'Có dùng được cho nhiều chi nhánh không?',
                answer: 'Có. Mỗi nhà hàng/chi nhánh có dữ liệu riêng trên cùng nền tảng TQM.',
            },
        ],
        ctaTitle: 'Bắt đầu dùng phần mềm gọi món QR TQM',
        ctaLead: 'Đăng nhập để thiết lập menu, bàn, POS và màn hình bếp trên một hệ thống.',
        related: [
            {
                path: '/phan-mem-quan-ly-nha-hang',
                label: 'Phần mềm quản lý nhà hàng',
                description: 'Menu, đơn, bàn, báo cáo trên một nền tảng.',
            },
            {
                path: '/pos-nha-hang',
                label: 'POS nhà hàng',
                description: 'Thu ngân đồng bộ đơn từ QR và bếp realtime.',
            },
        ],
    },
    {
        path: '/phan-mem-quan-ly-nha-hang',
        eyebrow: 'Phần mềm quản lý nhà hàng',
        title: 'Phần mềm quản lý nhà hàng',
        titleHighlight: 'và quán ăn trên một hệ thống',
        lead: 'TQM gom gọi món QR, quản lý thực đơn, đơn hàng, POS thu ngân, màn hình bếp và báo cáo vận hành để quán chạy mượt từ lúc khách ngồi bàn đến lúc thanh toán.',
        metaTitle: 'Phần mềm quản lý nhà hàng, quán ăn | TQM',
        metaDescription:
            'Phần mềm quản lý nhà hàng và quán ăn: gọi món QR, quản lý thực đơn, đơn realtime, POS thu ngân, màn hình bếp và báo cáo vận hành.',
        benefitsTitle: 'Vì sao quán cần phần mềm quản lý tập trung?',
        benefitsLead:
            'Khi order, bếp và thu ngân tách rời, quán dễ sót món, chậm phục vụ và khó nắm doanh thu theo ngày.',
        benefits: [
            {
                title: 'Một hệ thống cho cả quán',
                description:
                    'Menu, bàn, đơn, bếp và POS dùng chung dữ liệu. Nhân viên không phải chuyển tin nhắn hay ghi giấy giữa các khâu.',
            },
            {
                title: 'Quản lý thực đơn theo chi nhánh',
                description:
                    'Cập nhật món, giá, hình ảnh và trạng thái còn/hết tập trung, khách và thu ngân luôn thấy đúng thông tin.',
            },
            {
                title: 'Theo dõi đơn realtime',
                description:
                    'Trạng thái đơn cập nhật liên tục từ lúc nhận đến lúc hoàn thành, dễ kiểm soát giờ cao điểm.',
            },
            {
                title: 'Giảm sai sót vận hành',
                description:
                    'Ít phụ thuộc ghi nhớ cá nhân. Mỗi món có nguồn gốc rõ: bàn nào, lúc nào, ai xử lý.',
            },
            {
                title: 'Báo cáo giúp ra quyết định',
                description:
                    'Xem số đơn, doanh thu và hiệu suất phục vụ để điều chỉnh nhân sự, menu và giờ mở cửa.',
            },
            {
                title: 'Sẵn sàng mở rộng',
                description:
                    'Kiến trúc multi-tenant giúp mỗi nhà hàng có dữ liệu riêng, phù hợp khi bạn mở thêm chi nhánh.',
            },
        ],
        howTitle: 'Quy trình vận hành với TQM',
        howSteps: [
            {
                num: '01',
                title: 'Thiết lập nhà hàng',
                description: 'Tạo chi nhánh, bàn và phân quyền nhân sự trên hệ thống quản trị.',
            },
            {
                num: '02',
                title: 'Đưa menu lên hệ thống',
                description: 'Nhập danh mục và món ăn để dùng chung cho QR, POS và báo cáo.',
            },
            {
                num: '03',
                title: 'Nhận đơn từ nhiều kênh',
                description: 'Khách gọi món QR hoặc thu ngân tạo đơn POS, bếp nhận cùng một luồng.',
            },
            {
                num: '04',
                title: 'Đối soát cuối ca',
                description: 'Xem báo cáo đơn và doanh thu để chốt ca nhanh hơn.',
            },
        ],
        audienceTitle: 'Dành cho chủ quán và quản lý vận hành',
        audience: [
            'Chủ quán muốn số hóa order và bếp với chi phí hợp lý',
            'Quản lý ca cần nhìn trạng thái bàn và đơn realtime',
            'Nhà hàng đang dùng giấy/Excel muốn chuyển sang phần mềm',
            'Chuỗi nhỏ cần tách dữ liệu theo từng chi nhánh',
        ],
        faqTitle: 'Câu hỏi thường gặp',
        faqs: [
            {
                question: 'TQM khác gì app gọi món đơn thuần?',
                answer: 'TQM không chỉ có menu QR. Hệ thống gồm quản trị menu, POS, bếp và báo cáo để vận hành cả quán.',
            },
            {
                question: 'Có cần thiết bị đặc biệt không?',
                answer: 'Chủ yếu dùng trình duyệt trên máy tính/tablet cho quản trị, POS và bếp. Khách chỉ cần điện thoại để quét QR.',
            },
            {
                question: 'Triển khai mất bao lâu?',
                answer: 'Quán có thể bắt đầu từ việc tạo menu và bàn, rồi gắn QR để dùng trong ca phục vụ thực tế.',
            },
        ],
        ctaTitle: 'Dùng thử phần mềm quản lý nhà hàng TQM',
        ctaLead: 'Đăng nhập để quản lý menu, bàn, đơn hàng, POS và bếp trên cùng một nền tảng.',
        related: [
            {
                path: '/phan-mem-goi-mon-qr',
                label: 'Phần mềm gọi món QR',
                description: 'Khách tự đặt món tại bàn bằng mã QR.',
            },
            {
                path: '/pos-nha-hang',
                label: 'POS nhà hàng',
                description: 'Thu ngân xử lý đơn và thanh toán realtime.',
            },
        ],
    },
    {
        path: '/pos-nha-hang',
        eyebrow: 'POS nhà hàng',
        title: 'POS nhà hàng',
        titleHighlight: 'đồng bộ đơn QR và bếp',
        lead: 'Màn hình thu ngân TQM nhận đơn từ gọi món QR, hỗ trợ tạo/chỉnh order tại quầy và đồng bộ trạng thái với bếp để ca phục vụ chạy liền mạch.',
        metaTitle: 'POS nhà hàng đồng bộ gọi món QR và bếp | TQM',
        metaDescription:
            'POS nhà hàng TQM: nhận đơn từ gọi món QR, xử lý tại quầy, đồng bộ bếp realtime và hỗ trợ vận hành thu ngân cho quán ăn, nhà hàng.',
        benefitsTitle: 'Lợi ích của POS gắn với gọi món QR',
        benefitsLead:
            'POS không đứng riêng. Thu ngân thấy đúng đơn khách vừa gửi, bếp nhận đúng món cần làm.',
        benefits: [
            {
                title: 'Nhận đơn QR ngay trên POS',
                description:
                    'Khi khách gửi món từ bàn, thu ngân thấy đơn mới mà không cần nhập lại thủ công.',
            },
            {
                title: 'Tạo và chỉnh order tại quầy',
                description:
                    'Phù hợp khách order trực tiếp, thêm món, hoặc trường hợp cần hỗ trợ ngoài luồng QR.',
            },
            {
                title: 'Đồng bộ trạng thái với bếp',
                description:
                    'POS và màn hình bếp dùng chung luồng đơn, giảm tình trạng làm món trùng hoặc bỏ sót.',
            },
            {
                title: 'Kiểm soát bàn đang phục vụ',
                description:
                    'Nhìn nhanh bàn nào còn đơn mở, bàn nào sắp thanh toán để điều phối nhân sự.',
            },
            {
                title: 'Giảm sai lệch cuối ca',
                description:
                    'Đơn được ghi nhận tập trung giúp đối soát doanh thu và số lượng món rõ ràng hơn.',
            },
            {
                title: 'Dùng trên trình duyệt',
                description:
                    'Chạy trên máy tính hoặc tablet có mạng, không phụ thuộc một loại máy POS cứng nhắc.',
            },
        ],
        howTitle: 'Thu ngân dùng POS TQM thế nào?',
        howSteps: [
            {
                num: '01',
                title: 'Mở màn hình POS',
                description: 'Đăng nhập và chọn chi nhánh đang phục vụ.',
            },
            {
                num: '02',
                title: 'Theo dõi đơn mới',
                description: 'Đơn từ QR hoặc tạo tại quầy hiện realtime trên danh sách.',
            },
            {
                num: '03',
                title: 'Phối hợp với bếp',
                description: 'Cập nhật trạng thái để bếp và phục vụ nắm tiến độ món.',
            },
            {
                num: '04',
                title: 'Chốt đơn / thanh toán',
                description: 'Hoàn tất đơn theo quy trình quán và chuyển sang bàn tiếp theo.',
            },
        ],
        audienceTitle: 'Ai nên dùng POS TQM?',
        audience: [
            'Quán đang nhận order bằng giấy muốn chuyển số',
            'Nhà hàng dùng QR gọi món cần thu ngân kiểm soát đơn',
            'Quán đông cần đồng bộ bếp và thu ngân rõ ràng',
            'Chủ quán muốn theo dõi đơn realtime mà không đứng bếp',
        ],
        faqTitle: 'Câu hỏi thường gặp về POS nhà hàng',
        faqs: [
            {
                question: 'POS TQM có bắt buộc dùng cùng gọi món QR không?',
                answer: 'Nên dùng cùng nhau để giảm nhập tay, nhưng thu ngân vẫn có thể tạo đơn trực tiếp trên POS.',
            },
            {
                question: 'Có cần máy POS chuyên dụng không?',
                answer: 'Không bắt buộc. Có thể dùng máy tính hoặc tablet chạy trình duyệt.',
            },
            {
                question: 'POS có nối với màn hình bếp không?',
                answer: 'Có. Đơn và trạng thái được đồng bộ realtime giữa POS và bếp.',
            },
        ],
        ctaTitle: 'Dùng POS nhà hàng cùng TQM',
        ctaLead: 'Đăng nhập để kết nối gọi món QR, thu ngân và bếp trên một luồng đơn thống nhất.',
        related: [
            {
                path: '/phan-mem-goi-mon-qr',
                label: 'Phần mềm gọi món QR',
                description: 'Khách tự đặt món tại bàn bằng mã QR.',
            },
            {
                path: '/phan-mem-quan-ly-nha-hang',
                label: 'Phần mềm quản lý nhà hàng',
                description: 'Quản lý menu, bàn, đơn và báo cáo tập trung.',
            },
        ],
    },
];

export function getLandingByPath(pathname: string): LandingPageContent | undefined {
    return LANDING_PAGES.find((page) => page.path === pathname);
}

export const MARKETING_PATHS = LANDING_PAGES.map((page) => page.path);
