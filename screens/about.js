// renderAbout.js
const renderAbout = () => {
  return `
  <div class="max-w-md  mx-auto p-6
              text-[#00081f] dark:text-gray-200">

    <!-- Title -->
    <h2 class="text-lg font-bold text-center text-[#000081] dark:text-blue-400 mb-4">
      About Smart Mark
    </h2>

    <div class="space-y-4 text-sm leading-relaxed">

      <!-- Developer -->
      <p>
        <span class="font-semibold text-[#000081] dark:text-blue-300">Developer:</span>
        LuizGenz
      </p>

      <p>
        <span class="font-semibold text-[#000081] dark:text-blue-300">Application:</span>
        Smart Mark System
      </p>

      <p class="text-gray-700 dark:text-gray-300">
        This application was developed by <span class="font-semibold">LuizGenz</span>,
        a student software developer focused on building secure, efficient, and
        reliable school management systems.
      </p>

      <!-- Purpose -->
      <p class="text-gray-700 dark:text-gray-300">
        The system helps schools manage pupil attendance in a
        <span class="font-semibold">simple, accurate, and organized</span> manner
        while ensuring data protection.
      </p>

      <!-- Terms -->
      <div>
        <h3 class="font-semibold text-[#000081] dark:text-blue-300 mb-1">
          Terms & Conditions
        </h3>
        <p class="text-xs text-gray-600 dark:text-gray-400">
          This application is intended strictly for educational use.
          Any unauthorized access, copying, modification, or misuse of the
          system or its data is prohibited.
        </p>
      </div>

      <!-- Privacy -->
      <div>
        <h3 class="font-semibold text-[#000081] dark:text-blue-300 mb-1">
          Privacy Policy
        </h3>
        <p class="text-xs text-gray-600 dark:text-gray-400">
          Only essential school data such as attendance records is stored.
          No data is shared with third parties and all information is used
          solely for school administration.
        </p>
      </div>

      <!-- Permissions -->
      <div>
        <h3 class="font-semibold text-[#000081] dark:text-blue-300 mb-1">
          Permissions & Access
        </h3>
        <p class="text-xs text-gray-600 dark:text-gray-400">
          Access is restricted to <span class="font-semibold">Teachers</span> and
          <span class="font-semibold">Administrators</span>.
          Teachers manage attendance records, while administrators control
          system settings and data.
        </p>
      </div>

      <!-- Data Protection -->
      <div>
        <h3 class="font-semibold text-[#000081] dark:text-blue-300 mb-1">
          Data Protection
        </h3>
        <p class="text-xs text-gray-600 dark:text-gray-400">
          Reasonable security measures are applied to protect attendance data
          against unauthorized access, loss, or alteration.
        </p>
      </div>

      <!-- Footer -->
      <div class="pt-4 border-t border-[#e0e4ff] dark:border-[#1e293b] text-center">
        <p class="text-xs text-gray-500 dark:text-gray-400">
          Version 1.0.0 <br />
          © 2025 TheGenz. All rights reserved. <br />
          Unauthorized copying or redistribution is strictly prohibited.
        </p>
      </div>

    </div>
  </div>
  `;
};

export default renderAbout;


