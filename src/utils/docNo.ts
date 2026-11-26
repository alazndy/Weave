export const generateDocNo = (projectName: string = 'Weave Project', revision: string = 'R01') => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const acronym = projectName.trim().split(/\s+/).map(word => word[0]).join('').normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 6) || 'WP';
  const cleanRev = revision.replace(/[^a-zA-Z0-9]/g, '');
  return `${acronym}-${date}-${cleanRev}`;
};
